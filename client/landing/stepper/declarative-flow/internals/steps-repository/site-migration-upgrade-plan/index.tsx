import {
	PLAN_BUSINESS,
	PLAN_MIGRATION_TRIAL_MONTHLY,
	PlanSlug,
	getPlan,
	getPlanByPathSlug,
} from '@automattic/calypso-products';
import { Step } from '@automattic/onboarding';
import { useTranslate } from 'i18n-calypso';
import { UpgradePlan } from 'calypso/blocks/importer/wordpress/upgrade-plan';
import DocumentHead from 'calypso/components/data/document-head';
import { useSelectedPlanUpgradeQuery } from 'calypso/data/import-flow/use-selected-plan-upgrade';
import { useQuery } from 'calypso/landing/stepper/hooks/use-query';
import { useSite } from 'calypso/landing/stepper/hooks/use-site';
import { useSiteSlug } from 'calypso/landing/stepper/hooks/use-site-slug';
import type { Step as StepType } from '../../types';

import './style.scss';

const SiteMigrationUpgradePlan: StepType< {
	accepts: {
		skipLabelText?: string;
		onSkip?: () => void;
		skipPosition?: 'top' | 'bottom';
		headerText?: string;
	};
	submits: {
		goToCheckout?: boolean;
		plan?: string;
		sendIntentWhenCreatingTrial?: boolean;
		verifyEmail?: boolean;
	};
} > = ( { navigation, data } ) => {
	const siteItem = useSite();
	const siteSlug = useSiteSlug();
	const translate = useTranslate();
	const queryParams = useQuery();
	const hideFreeMigrationTrialForNonVerifiedEmail =
		( data?.hideFreeMigrationTrialForNonVerifiedEmail as boolean | undefined ) ?? true;

	const selectedPlanData = useSelectedPlanUpgradeQuery();
	const selectedPlanPathSlug = selectedPlanData.data;

	const plan = selectedPlanPathSlug
		? getPlanByPathSlug( selectedPlanPathSlug )
		: getPlan( PLAN_BUSINESS );

	if ( ! siteItem || ! siteSlug || ! plan ) {
		return;
	}
	const migrateFrom = queryParams.get( 'from' );

	const goToCheckout = ( planSlug: PlanSlug ) => {
		const plan = getPlan( planSlug );
		navigation?.submit?.( {
			goToCheckout: true,
			plan: plan?.getPathSlug ? plan.getPathSlug() : '',
		} );
	};

	const customTracksEventProps = {
		from: migrateFrom,
		has_source_site: migrateFrom !== '' && migrateFrom !== null,
	};

	const stepContent = (
		<UpgradePlan
			site={ siteItem }
			ctaText={ translate( 'Upgrade and migrate' ) }
			subTitleText=""
			isBusy={ false }
			hideTitleAndSubTitle
			onCtaClick={ goToCheckout }
			onFreeTrialClick={ () => {
				navigation.submit?.( {
					goToCheckout: true,
					plan: PLAN_MIGRATION_TRIAL_MONTHLY,
					sendIntentWhenCreatingTrial: true,
				} );
			} }
			navigateToVerifyEmailStep={ () => {
				navigation.submit?.( { verifyEmail: true } );
			} }
			hideFreeMigrationTrialForNonVerifiedEmail={ hideFreeMigrationTrialForNonVerifiedEmail }
			trackingEventsProps={ customTracksEventProps }
			visiblePlan={ plan.getStoreSlug() }
			showVariants
		/>
	);

	const headerText = translate( 'There is a plan for you' );
	const planName = getPlan( PLAN_BUSINESS )?.getTitle() ?? '';

	const subHeaderText = translate(
		'A %(planName)s plan is needed for Migrations. Choose an option below to access our lightning-fast infrastructure for a faster, more reliable site.',
		{
			args: {
				planName,
			},
		}
	);

	return (
		<>
			<DocumentHead title={ headerText } />
			<Step.CenteredColumnLayout
				columnWidth={ 5 }
				topBar={ <Step.TopBar leftElement={ <Step.BackButton onClick={ navigation.goBack } /> } /> }
				heading={ <Step.Heading text={ headerText } subText={ subHeaderText } /> }
				className="site-migration-upgrade-plan-v2"
			>
				{ stepContent }
			</Step.CenteredColumnLayout>
		</>
	);
};

export default SiteMigrationUpgradePlan;
