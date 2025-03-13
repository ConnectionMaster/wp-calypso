import { PLAN_MIGRATION_TRIAL_MONTHLY } from '@automattic/calypso-products';
import { Onboard, type SiteSelect, type UserSelect } from '@automattic/data-stores';
import { isHostedSiteMigrationFlow } from '@automattic/onboarding';
import { SiteExcerptData } from '@automattic/sites';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from 'react';
import { HOSTING_INTENT_MIGRATE } from 'calypso/data/hosting/use-add-hosting-trial-mutation';
import { useFlowState } from 'calypso/landing/stepper/declarative-flow/internals/state-manager/store';
import { useQuery } from 'calypso/landing/stepper/hooks/use-query';
import { stepsWithRequiredLogin } from 'calypso/landing/stepper/utils/steps-with-required-login';
import { triggerGuidesForStep } from 'calypso/lib/guides/trigger-guides-for-step';
import { ImporterPlatform } from 'calypso/lib/importer/types';
import { addQueryArgs } from 'calypso/lib/url';
import { useSelector } from 'calypso/state';
import { getSiteAdminUrl, getSiteWooCommerceUrl } from 'calypso/state/sites/selectors';
import { HOW_TO_MIGRATE_OPTIONS } from '../constants';
import { useIsSiteAdmin } from '../hooks/use-is-site-admin';
import { useSiteData } from '../hooks/use-site-data';
import { useSiteSlugParam } from '../hooks/use-site-slug-param';
import { USER_STORE, SITE_STORE, ONBOARD_STORE } from '../stores';
import { goToCheckout } from '../utils/checkout';
import { STEPS } from './internals/steps';
import { getSiteIdParam } from './internals/steps-repository/import/util';
import { type SiteMigrationIdentifyAction } from './internals/steps-repository/site-migration-identify';
import { AssertConditionState } from './internals/types';
import { goToImporter } from './migration/helpers';
import type { AssertConditionResult, Flow, ProvidedDependencies } from './internals/types';

const FLOW_NAME = 'site-migration';

const siteMigration: Flow = {
	name: FLOW_NAME,
	isSignupFlow: false,
	__experimentalUseSessions: true,

	useSideEffect() {
		const { setIntent } = useDispatch( ONBOARD_STORE );
		useEffect( () => {
			setIntent( Onboard.SiteIntent.SiteMigration );
		}, [] );
		const { set, get } = useFlowState();
		const urlQueryParams = useQuery();
		const ref = urlQueryParams.get( 'ref' );

		if ( ref && ! get( 'migration' )?.entryPoint ) {
			set( 'migration', { entryPoint: ref } );
		}
	},

	useSteps() {
		const baseSteps = [
			STEPS.SITE_MIGRATION_IDENTIFY,
			STEPS.SITE_MIGRATION_IMPORT_OR_MIGRATE,
			STEPS.SITE_MIGRATION_HOW_TO_MIGRATE,
			STEPS.SITE_MIGRATION_UPGRADE_PLAN,
			STEPS.SITE_MIGRATION_ASSIGN_TRIAL_PLAN,
			STEPS.SITE_MIGRATION_INSTRUCTIONS,
			STEPS.SITE_MIGRATION_STARTED,
			STEPS.ERROR,
			STEPS.SITE_MIGRATION_ASSISTED_MIGRATION,
			STEPS.SITE_MIGRATION_FALLBACK_CREDENTIALS,
			STEPS.SITE_MIGRATION_CREDENTIALS,
			STEPS.SITE_MIGRATION_ALREADY_WPCOM,
			STEPS.SITE_MIGRATION_OTHER_PLATFORM_DETECTED_IMPORT,
			STEPS.SITE_MIGRATION_APPLICATION_PASSWORD_AUTHORIZATION,
			STEPS.SITE_MIGRATION_SUPPORT_INSTRUCTIONS,
		];

		const hostedVariantSteps = isHostedSiteMigrationFlow( this.variantSlug ?? FLOW_NAME )
			? [ STEPS.PICK_SITE, STEPS.SITE_CREATION_STEP, STEPS.PROCESSING ]
			: [];

		return stepsWithRequiredLogin( [ ...baseSteps, ...hostedVariantSteps ] );
	},

	useAssertConditions(): AssertConditionResult {
		const { siteSlug, siteId } = useSiteData();
		const { isAdmin } = useIsSiteAdmin();
		const userIsLoggedIn = useSelect(
			( select ) => ( select( USER_STORE ) as UserSelect ).isCurrentUserLoggedIn(),
			[]
		);
		const flowPath = this.variantSlug ?? FLOW_NAME;

		useEffect( () => {
			if ( isAdmin === false ) {
				window.location.assign( '/start' );
			}
		}, [ isAdmin ] );

		if ( userIsLoggedIn && ! siteSlug && ! siteId && ! isHostedSiteMigrationFlow( flowPath ) ) {
			window.location.assign( '/' );
			return {
				state: AssertConditionState.FAILURE,
				message: 'site-migration does not have the site slug or site id.',
			};
		}

		return { state: AssertConditionState.SUCCESS };
	},

	useStepNavigation( currentStep, _navigate ) {
		const flowName = this.name;
		const { siteId } = useSiteData();
		const variantSlug = this.variantSlug;
		const flowPath = variantSlug ?? flowName;
		const siteCount =
			useSelect( ( select ) => ( select( USER_STORE ) as UserSelect ).getCurrentUser(), [] )
				?.site_count ?? 0;
		const siteSlugParam = useSiteSlugParam();
		const urlQueryParams = useQuery();
		const fromQueryParam = urlQueryParams.get( 'from' );
		const actionQueryParam = urlQueryParams.get( 'action' );
		const { getSiteIdBySlug } = useSelect( ( select ) => select( SITE_STORE ) as SiteSelect, [] );

		const { get, sessionId } = useFlowState();

		const siteAdminUrl = useSelector( ( state ) => getSiteAdminUrl( state, siteId ) );
		const siteWooCommerceUrl = useSelector( ( state ) => getSiteWooCommerceUrl( state, siteId ) );

		const exitFlow = ( to: string ) => {
			return window.location.assign( addQueryArgs( { sessionId }, to ) );
		};

		const navigate = ( to: string, state?: Parameters< typeof _navigate >[ 1 ] ) => {
			return _navigate( addQueryArgs( { sessionId }, to ), state );
		};

		// Call triggerGuidesForStep for the current step
		useEffect( () => {
			triggerGuidesForStep( flowName, currentStep, siteId );
		}, [ flowName, currentStep, siteId ] );

		// TODO - We may need to add `...params: string[]` back once we start adding more steps.
		async function submit( providedDependencies: ProvidedDependencies = {} ) {
			const siteSlug = ( providedDependencies?.siteSlug as string ) || siteSlugParam || '';
			const siteId = getSiteIdBySlug( siteSlug ) || getSiteIdParam( urlQueryParams );

			switch ( currentStep ) {
				case STEPS.SITE_MIGRATION_IDENTIFY.slug: {
					const { from, platform, action } = providedDependencies as {
						from: string;
						platform: string;
						action: SiteMigrationIdentifyAction;
					};

					if ( action === 'skip_platform_identification' || platform !== 'wordpress' ) {
						if ( isHostedSiteMigrationFlow( variantSlug ?? '' ) ) {
							// siteId/siteSlug wont be defined here if coming from a direct link/signup.
							// We need to make sure there's a site to import into.
							if ( ! siteSlugParam ) {
								return navigate(
									addQueryArgs( { from, skipMigration: true }, STEPS.SITE_CREATION_STEP.slug )
								);
							}
						}
						return exitFlow(
							addQueryArgs(
								{
									siteId,
									siteSlug,
									from,
									origin: STEPS.SITE_MIGRATION_IDENTIFY.slug,
									backToFlow: `/${ flowPath }/${ STEPS.SITE_MIGRATION_IDENTIFY.slug }`,
								},
								'/setup/site-setup/importList'
							)
						);
					}

					if ( isHostedSiteMigrationFlow( variantSlug ?? '' ) ) {
						if ( ! siteSlugParam ) {
							if ( siteCount > 0 ) {
								return navigate( `sitePicker?from=${ encodeURIComponent( from ) }` );
							}

							if ( from ) {
								return navigate( addQueryArgs( { from }, STEPS.SITE_CREATION_STEP.slug ) );
							}

							return navigate( 'error' );
						}
					}

					return navigate(
						addQueryArgs(
							{ from: from, siteSlug, siteId },
							STEPS.SITE_MIGRATION_IMPORT_OR_MIGRATE.slug
						)
					);
				}

				case STEPS.PICK_SITE.slug: {
					switch ( providedDependencies?.action ) {
						case 'update-query': {
							const newQueryParams =
								( providedDependencies?.queryParams as { [ key: string ]: string } ) || {};

							Object.keys( newQueryParams ).forEach( ( key ) => {
								newQueryParams[ key ]
									? urlQueryParams.set( key, newQueryParams[ key ] )
									: urlQueryParams.delete( key );
							} );

							return navigate( `sitePicker?${ urlQueryParams.toString() }` );
						}
						case 'select-site': {
							const { ID: newSiteId, slug: newSiteSlug } =
								providedDependencies.site as SiteExcerptData;

							// If the action is migrate, navigate to the DIY/DIFM selector screen.
							if ( 'migrate' === actionQueryParam ) {
								return navigate(
									addQueryArgs(
										{ siteId: newSiteId, siteSlug: newSiteSlug, from: fromQueryParam },
										STEPS.SITE_MIGRATION_HOW_TO_MIGRATE.slug
									)
								);
							}
							return navigate(
								addQueryArgs(
									{ siteId: newSiteId, siteSlug: newSiteSlug, from: fromQueryParam },
									STEPS.SITE_MIGRATION_IMPORT_OR_MIGRATE.slug
								)
							);
						}
						case 'create-site':
							return navigate(
								addQueryArgs( { from: fromQueryParam }, STEPS.SITE_CREATION_STEP.slug )
							);
					}
				}

				case STEPS.SITE_CREATION_STEP.slug: {
					const queryArgs = {
						from: fromQueryParam,
						skipMigration: 'import' === actionQueryParam ? true : undefined,
					};

					return navigate( addQueryArgs( queryArgs, STEPS.PROCESSING.slug ) );
				}

				case STEPS.PROCESSING.slug: {
					if ( providedDependencies?.siteCreated ) {
						if ( ! fromQueryParam || providedDependencies?.skipMigration ) {
							// If we get to this point without a fromQueryParam then we are coming from a direct
							// pick your current platform link. That's why we navigate to the importList step.
							return exitFlow(
								addQueryArgs(
									{
										siteId,
										siteSlug,
										origin: STEPS.SITE_MIGRATION_IDENTIFY.slug,
										backToFlow: `/${ flowPath }/${ STEPS.SITE_MIGRATION_IDENTIFY.slug }`,
										...( fromQueryParam && { from: fromQueryParam } ),
									},
									'/setup/site-setup/importList'
								)
							);
						}

						// If the action is migrate, navigate to the DIY/DIFM selector screen.
						if ( 'migrate' === actionQueryParam ) {
							return navigate(
								addQueryArgs(
									{ siteId, siteSlug, from: fromQueryParam },
									STEPS.SITE_MIGRATION_HOW_TO_MIGRATE.slug
								)
							);
						}

						return navigate(
							addQueryArgs(
								{ siteId, siteSlug, from: fromQueryParam },
								STEPS.SITE_MIGRATION_IMPORT_OR_MIGRATE.slug
							)
						);
					}
				}

				case STEPS.SITE_MIGRATION_IMPORT_OR_MIGRATE.slug: {
					// Switch to the normal Import flow.
					if ( providedDependencies?.destination === 'import' ) {
						if ( urlQueryParams.get( 'ref' ) === 'calypso-importer' ) {
							return exitFlow(
								addQueryArgs(
									{ engine: 'wordpress', ref: 'site-migration' },
									`/import/${ siteSlug }`
								)
							);
						}

						return exitFlow(
							addQueryArgs(
								{
									siteId,
									siteSlug,
									from: fromQueryParam ?? '',
									option: 'content',
									backToFlow: `/${ flowPath }/${ STEPS.SITE_MIGRATION_IMPORT_OR_MIGRATE.slug }`,
								},
								'/setup/site-setup/importerWordpress'
							)
						);
					}

					return navigate(
						addQueryArgs(
							{
								siteId,
								siteSlug,
								from: fromQueryParam,
							},
							STEPS.SITE_MIGRATION_HOW_TO_MIGRATE.slug
						)
					);
				}

				case STEPS.SITE_MIGRATION_HOW_TO_MIGRATE.slug: {
					// Take the user to the upgrade plan step.
					if ( providedDependencies?.destination === 'upgrade' ) {
						return navigate(
							addQueryArgs(
								{
									siteId,
									siteSlug,
									from: fromQueryParam,
									destination: providedDependencies?.destination,
									how: providedDependencies?.how as string,
								},
								STEPS.SITE_MIGRATION_UPGRADE_PLAN.slug
							)
						);
					}

					// Do it for me option.
					if ( providedDependencies?.how === HOW_TO_MIGRATE_OPTIONS.DO_IT_FOR_ME ) {
						return navigate(
							addQueryArgs(
								{
									siteSlug,
									from: fromQueryParam,
									siteId,
								},
								STEPS.SITE_MIGRATION_CREDENTIALS.slug
							)
						);
					}

					// Continue with the migration flow.
					return navigate(
						addQueryArgs(
							{ siteId, siteSlug, from: fromQueryParam },
							STEPS.SITE_MIGRATION_INSTRUCTIONS.slug
						)
					);
				}

				//TODO: Check if we can remove this step once there is no reference to it in the codebase.
				case STEPS.SITE_MIGRATION_ASSIGN_TRIAL_PLAN.slug: {
					if ( providedDependencies?.error ) {
						return navigate( STEPS.ERROR.slug );
					}

					return navigate( addQueryArgs( { siteId, siteSlug }, STEPS.ERROR.slug ) );
				}

				case STEPS.SITE_MIGRATION_UPGRADE_PLAN.slug: {
					if ( providedDependencies?.goToCheckout ) {
						let redirectAfterCheckout = STEPS.SITE_MIGRATION_INSTRUCTIONS.slug;

						if (
							providedDependencies?.userAcceptedDeal ||
							urlQueryParams.get( 'how' ) === HOW_TO_MIGRATE_OPTIONS.DO_IT_FOR_ME
						) {
							redirectAfterCheckout = STEPS.SITE_MIGRATION_CREDENTIALS.slug;
						}

						const destination = addQueryArgs(
							{
								siteSlug,
								from: fromQueryParam,
								siteId,
							},
							`/setup/${ flowPath }/${ redirectAfterCheckout }`
						);

						urlQueryParams.delete( 'showModal' );
						goToCheckout( {
							flowName: flowPath,
							stepName: STEPS.SITE_MIGRATION_UPGRADE_PLAN.slug,
							siteSlug: siteSlug,
							destination: destination,
							from: fromQueryParam ?? undefined,
							plan: providedDependencies.plan as string,
							cancelDestination: `/setup/${ flowPath }/${
								STEPS.SITE_MIGRATION_UPGRADE_PLAN.slug
							}?${ urlQueryParams.toString() }`,
							extraQueryParams:
								providedDependencies?.sendIntentWhenCreatingTrial &&
								providedDependencies?.plan === PLAN_MIGRATION_TRIAL_MONTHLY
									? { hosting_intent: HOSTING_INTENT_MIGRATE }
									: {},
						} );
						return;
					}
				}

				case STEPS.SITE_MIGRATION_INSTRUCTIONS.slug: {
					return navigate(
						addQueryArgs(
							{
								siteId,
								siteSlug,
								from: fromQueryParam,
							},
							STEPS.SITE_MIGRATION_STARTED.slug
						)
					);
				}

				case STEPS.SITE_MIGRATION_CREDENTIALS.slug: {
					const { action, from, authorizationUrl } = providedDependencies as {
						action:
							| 'skip'
							| 'submit'
							| 'application-passwords-approval'
							| 'credentials-required'
							| 'already-wpcom'
							| 'site-is-not-using-wordpress';
						from: string;
						authorizationUrl: string;
					};

					if ( action === 'skip' ) {
						return navigate(
							addQueryArgs(
								{ siteId, from: from || fromQueryParam, siteSlug },
								STEPS.SITE_MIGRATION_ASSISTED_MIGRATION.slug
							)
						);
					}

					if ( action === 'already-wpcom' ) {
						return navigate(
							addQueryArgs(
								{ siteId, from: from || fromQueryParam, siteSlug },
								STEPS.SITE_MIGRATION_ALREADY_WPCOM.slug
							)
						);
					}

					if ( action === 'site-is-not-using-wordpress' ) {
						return navigate(
							addQueryArgs(
								{
									siteId,
									from: from || fromQueryParam,
									siteSlug,
									platform: providedDependencies.platform as string,
								},
								STEPS.SITE_MIGRATION_OTHER_PLATFORM_DETECTED_IMPORT.slug
							)
						);
					}

					if ( action === 'application-passwords-approval' ) {
						return navigate(
							addQueryArgs(
								{
									siteId,
									from: from || fromQueryParam,
									siteSlug,
									authorizationUrl,
								},
								STEPS.SITE_MIGRATION_APPLICATION_PASSWORD_AUTHORIZATION.slug
							)
						);
					}

					if ( action === 'credentials-required' ) {
						return navigate(
							addQueryArgs(
								{ siteId, from: from || fromQueryParam, siteSlug },
								STEPS.SITE_MIGRATION_FALLBACK_CREDENTIALS.slug
							)
						);
					}

					return navigate(
						addQueryArgs(
							{ siteId, from: from || fromQueryParam, siteSlug, preventTicketCreation: true },
							STEPS.SITE_MIGRATION_ASSISTED_MIGRATION.slug
						)
					);
				}

				case STEPS.SITE_MIGRATION_FALLBACK_CREDENTIALS.slug: {
					const { action, from } = providedDependencies as {
						action: 'skip' | 'submit';
						from: string;
					};

					if ( action === 'skip' ) {
						return navigate(
							addQueryArgs(
								{ siteId, from: from || fromQueryParam, siteSlug, preventTicketCreation: true },
								STEPS.SITE_MIGRATION_ASSISTED_MIGRATION.slug
							)
						);
					}
					//TODO: Check if both conditions are needed.
					return navigate(
						addQueryArgs(
							{ siteId, from: from || fromQueryParam, siteSlug, preventTicketCreation: true },
							STEPS.SITE_MIGRATION_ASSISTED_MIGRATION.slug
						)
					);
				}

				case STEPS.SITE_MIGRATION_ASSISTED_MIGRATION.slug: {
					const { hasError } = providedDependencies as {
						hasError?: 'ticket-creation';
					};

					if ( hasError === 'ticket-creation' ) {
						return navigate(
							addQueryArgs(
								{ siteId, siteSlug, from: fromQueryParam, error: hasError },
								STEPS.SITE_MIGRATION_CREDENTIALS.slug
							)
						);
					}
				}

				case STEPS.SITE_MIGRATION_ALREADY_WPCOM.slug: {
					return navigate(
						addQueryArgs(
							{ siteId, from: fromQueryParam, siteSlug, preventTicketCreation: true },
							STEPS.SITE_MIGRATION_SUPPORT_INSTRUCTIONS.slug
						)
					);
				}
				case STEPS.SITE_MIGRATION_OTHER_PLATFORM_DETECTED_IMPORT.slug: {
					if ( providedDependencies?.action === 'import' ) {
						return goToImporter( {
							platform: providedDependencies.platform as ImporterPlatform,
							siteId: siteId!.toString(),
							siteSlug,
							backToFlow: `${ FLOW_NAME }/${ STEPS.SITE_MIGRATION_OTHER_PLATFORM_DETECTED_IMPORT.slug }`,
							from: fromQueryParam,
							ref: FLOW_NAME,
						} );
					}

					return navigate(
						addQueryArgs(
							{ siteId, from: fromQueryParam, siteSlug },
							STEPS.SITE_MIGRATION_SUPPORT_INSTRUCTIONS.slug
						)
					);
				}

				case STEPS.SITE_MIGRATION_APPLICATION_PASSWORD_AUTHORIZATION.slug: {
					const { action, authorizationUrl, from } = providedDependencies as {
						action: string;
						from: string;
						authorizationUrl: string;
					};

					if ( action === 'authorization' ) {
						const currentUrl = window.location.href;
						const successUrl = encodeURIComponent( currentUrl );
						return exitFlow( authorizationUrl + `&success_url=${ successUrl }` );
					}

					if ( action === 'fallback-credentials' ) {
						return navigate(
							addQueryArgs(
								{
									siteId,
									siteSlug,
									authorizationUrl,
									backTo: STEPS.SITE_MIGRATION_APPLICATION_PASSWORD_AUTHORIZATION.slug,
									from: fromQueryParam,
								},
								STEPS.SITE_MIGRATION_FALLBACK_CREDENTIALS.slug
							)
						);
					}

					//TODO: Add a skip flag to track the user is having trouble to share the credentials.
					return navigate(
						addQueryArgs(
							{ siteId, from: from || fromQueryParam, siteSlug, preventTicketCreation: true },
							STEPS.SITE_MIGRATION_ASSISTED_MIGRATION.slug
						)
					);
				}
			}
		}

		const goBack = () => {
			const siteSlug = urlQueryParams.get( 'siteSlug' ) || '';
			const siteId = urlQueryParams.get( 'siteId' ) || '';
			const entryPoint = get( 'migration' )?.entryPoint;

			switch ( currentStep ) {
				case STEPS.SITE_MIGRATION_IMPORT_OR_MIGRATE.slug: {
					if ( entryPoint === 'calypso-importer' ) {
						return exitFlow( addQueryArgs( { ref: 'site-migration' }, `/import/${ siteSlug }` ) );
					}

					if ( entryPoint === 'wp-admin' ) {
						if ( null !== siteAdminUrl ) {
							window.location.replace( `${ siteAdminUrl }import.php` );
							return;
						}
						// Unexpected behavior probably caused by the user tinkering with the URL. Redirect to /start.
						return exitFlow( '/start' );
					}

					return navigate(
						addQueryArgs( { siteSlug, siteId }, STEPS.SITE_MIGRATION_IDENTIFY.slug )
					);
				}

				case STEPS.SITE_MIGRATION_HOW_TO_MIGRATE.slug: {
					return navigate(
						addQueryArgs( { siteSlug, siteId }, STEPS.SITE_MIGRATION_IMPORT_OR_MIGRATE.slug )
					);
				}

				case STEPS.SITE_MIGRATION_IDENTIFY.slug: {
					return exitFlow( `/setup/site-setup/goals?${ urlQueryParams }` );
				}

				case STEPS.SITE_MIGRATION_UPGRADE_PLAN.slug: {
					if ( urlQueryParams.has( 'showModal' ) ) {
						urlQueryParams.delete( 'showModal' );
					}

					return navigate( `${ STEPS.SITE_MIGRATION_HOW_TO_MIGRATE.slug }?${ urlQueryParams }` );
				}

				case STEPS.SITE_MIGRATION_CREDENTIALS.slug: {
					if ( entryPoint === 'entrepreneur-signup' ) {
						// Note that the main entrepreneur flow takes users into the customize your store (CYS) UI,
						// but that's a bit abrupt for users who've gone through this secondary flow.
						if ( siteWooCommerceUrl ) {
							return exitFlow( siteWooCommerceUrl );
						} else if ( siteAdminUrl ) {
							return exitFlow( siteAdminUrl );
						}

						return exitFlow( `/home/${ siteId }` );
					}

					return navigate( `${ STEPS.SITE_MIGRATION_HOW_TO_MIGRATE.slug }?${ urlQueryParams }` );
				}

				case STEPS.SITE_MIGRATION_OTHER_PLATFORM_DETECTED_IMPORT.slug: {
					return navigate( `${ STEPS.SITE_MIGRATION_CREDENTIALS.slug }?${ urlQueryParams }` );
				}

				case STEPS.SITE_MIGRATION_FALLBACK_CREDENTIALS.slug: {
					if (
						urlQueryParams.get( 'backTo' ) ===
						STEPS.SITE_MIGRATION_APPLICATION_PASSWORD_AUTHORIZATION.slug
					) {
						return navigate(
							`${ STEPS.SITE_MIGRATION_APPLICATION_PASSWORD_AUTHORIZATION.slug }?${ urlQueryParams }`
						);
					}

					return navigate( `${ STEPS.SITE_MIGRATION_CREDENTIALS.slug }?${ urlQueryParams }` );
				}

				case STEPS.SITE_MIGRATION_APPLICATION_PASSWORD_AUTHORIZATION.slug: {
					return navigate( `${ STEPS.SITE_MIGRATION_CREDENTIALS.slug }?${ urlQueryParams }` );
				}

				case STEPS.SITE_MIGRATION_ALREADY_WPCOM.slug: {
					return navigate( `${ STEPS.SITE_MIGRATION_CREDENTIALS.slug }?${ urlQueryParams }` );
				}
			}
		};

		return { goBack, submit, exitFlow };
	},
};

export default siteMigration;
