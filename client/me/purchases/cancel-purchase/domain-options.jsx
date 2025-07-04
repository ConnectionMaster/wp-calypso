import {
	isDomainRegistration,
	isDomainMapping,
	isDomainTransfer,
} from '@automattic/calypso-products';
import { CompactCard, FormLabel } from '@automattic/components';
import { localizeUrl } from '@automattic/i18n-utils';
import { UPDATE_NAMESERVERS } from '@automattic/urls';
import { useTranslate } from 'i18n-calypso';
import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import FormCheckbox from 'calypso/components/forms/form-checkbox';
import FormRadio from 'calypso/components/forms/form-radio';
import { getName, isRefundable, isSubscription } from 'calypso/lib/purchases';
import { recordTracksEvent } from 'calypso/state/analytics/actions';

const NonRefundableDomainMappingMessage = ( { includedDomainPurchase } ) => {
	const translate = useTranslate();
	return (
		<div>
			<p>
				{ translate(
					'This plan includes the custom domain mapping for %(mappedDomain)s. ' +
						'The domain will not be removed along with the plan, to avoid any interruptions for your visitors.',
					{
						args: {
							mappedDomain: includedDomainPurchase.meta,
						},
					}
				) }
			</p>
		</div>
	);
};

const CancelableDomainMappingMessage = ( { includedDomainPurchase, purchase } ) => {
	const translate = useTranslate();
	return (
		<div>
			<p>
				{ translate(
					'This plan includes mapping for the domain %(mappedDomain)s. ' +
						"Cancelling will remove all the plan's features from your site, including the domain.",
					{
						args: {
							mappedDomain: includedDomainPurchase.meta,
						},
					}
				) }
			</p>
			<p>
				{ translate(
					'Your site will no longer be available at %(mappedDomain)s. Instead, it will be at %(wordpressSiteUrl)s',
					{
						args: {
							mappedDomain: includedDomainPurchase.meta,
							wordpressSiteUrl: purchase.domain,
						},
					}
				) }
			</p>
			<p>
				{ translate(
					'The domain %(mappedDomain)s itself is not canceled. Only the connection between WordPress.com and ' +
						'your domain is removed. %(mappedDomain)s is registered elsewhere and you can still use it with other sites.',
					{
						args: {
							mappedDomain: includedDomainPurchase.meta,
						},
					}
				) }
			</p>
		</div>
	);
};

const CancelPlanWithoutCancellingDomainMessage = ( { planPurchase, includedDomainPurchase } ) => {
	const translate = useTranslate();
	return (
		<div>
			<p>
				{ isDomainTransfer( includedDomainPurchase )
					? translate(
							'This plan includes a domain transfer, %(domain)s. The domain will not be removed along with the plan, to avoid any interruptions for your visitors.',
							{
								args: {
									domain: includedDomainPurchase.meta,
								},
							}
					  )
					: translate(
							'This plan includes the custom domain, %(domain)s. The domain will not be removed along with the plan, to avoid any interruptions for your visitors.',
							{
								args: {
									domain: includedDomainPurchase.meta,
								},
							}
					  ) }
			</p>
			{ isRefundable( planPurchase ) && (
				<p>
					{ translate(
						'You will receive a partial refund of %(refundAmount)s which is %(planCost)s for the plan ' +
							'minus %(domainCost)s for the domain.',
						{
							args: {
								domainCost: includedDomainPurchase.costToUnbundleText,
								planCost: planPurchase.totalRefundText,
								refundAmount: planPurchase.refundText,
							},
						}
					) }
				</p>
			) }
		</div>
	);
};

const CancelPurchaseDomainOptions = ( {
	includedDomainPurchase,
	cancelBundledDomain,
	purchase,
	onCancelConfirmationStateChange,
	isLoading = false,
} ) => {
	const translate = useTranslate();
	const [ confirmCancel, setConfirmCancel ] = useState( false );
	const dispatch = useDispatch();

	const onCancelBundledDomainChange = useCallback(
		( event ) => {
			const newCancelBundledDomainValue = event.currentTarget.value === 'cancel';
			onCancelConfirmationStateChange( {
				cancelBundledDomain: newCancelBundledDomainValue,
				confirmCancelBundledDomain: newCancelBundledDomainValue && confirmCancel,
			} );
		},
		[ confirmCancel, onCancelConfirmationStateChange ]
	);

	const onConfirmCancelBundledDomainChange = useCallback(
		( event ) => {
			const checked = event.target.checked;
			setConfirmCancel( checked );
			onCancelConfirmationStateChange( {
				cancelBundledDomain,
				confirmCancelBundledDomain: checked,
			} );

			// Record tracks event for domain confirmation checkbox
			dispatch(
				recordTracksEvent( 'calypso_purchases_domain_confirm_checkbox', {
					product_slug: purchase.productSlug,
					purchase_id: purchase.id,
					domain_name: includedDomainPurchase.meta,
					checked: checked,
				} )
			);
		},
		[
			cancelBundledDomain,
			onCancelConfirmationStateChange,
			purchase,
			includedDomainPurchase,
			dispatch,
		]
	);

	if ( ! includedDomainPurchase || ! isSubscription( purchase ) ) {
		return null;
	}

	if (
		! isDomainMapping( includedDomainPurchase ) &&
		! isDomainRegistration( includedDomainPurchase ) &&
		! isDomainTransfer( includedDomainPurchase )
	) {
		return null;
	}

	// Domain mappings get treated separately for now. (It is also rare for a
	// plan's domain credit to be used on a domain mapping in the first place.)
	if ( isDomainMapping( includedDomainPurchase ) ) {
		if ( ! isRefundable( purchase ) ) {
			return (
				<NonRefundableDomainMappingMessage includedDomainPurchase={ includedDomainPurchase } />
			);
		}

		return (
			<CancelableDomainMappingMessage
				includedDomainPurchase={ includedDomainPurchase }
				purchase={ purchase }
			/>
		);
	}

	// In most other cases, we'll cancel the plan and leave the domain alone.
	// Those are handled here.
	// The one exception is when a plan and domain registration are both in
	// their refund window (e.g. they were recently purchased, and likely
	// purchased together), in which case we allow the user to cancel both at
	// the same time for convenience. We don't do that for domain transfers
	// currently, although we probably could (but domain transfers are
	// inherently in a state of flux and also potentially harder for customers
	// to understand exactly what they're cancelling).
	if (
		isDomainTransfer( includedDomainPurchase ) ||
		! isRefundable( purchase ) ||
		! isRefundable( includedDomainPurchase )
	) {
		return (
			<CancelPlanWithoutCancellingDomainMessage
				includedDomainPurchase={ includedDomainPurchase }
				planPurchase={ purchase }
			/>
		);
	}

	return (
		<div className="cancel-purchase__domain-options">
			<p>
				{ translate(
					'Your plan includes the custom domain {{strong}}%(domain)s{{/strong}}. What would you like to do with the domain?',
					{
						args: {
							domain: includedDomainPurchase.meta,
						},
						components: {
							strong: <strong />,
						},
					}
				) }
			</p>
			<CompactCard>
				<FormLabel key="keep_bundled_domain">
					<FormRadio
						name="keep_bundled_domain_false"
						value="keep"
						checked={ ! cancelBundledDomain }
						onChange={ onCancelBundledDomainChange }
						disabled={ isLoading }
						label={
							<>
								{ translate( 'Cancel the plan, but keep "%(domain)s"', {
									args: {
										domain: includedDomainPurchase.meta,
									},
								} ) }
								<br />
								<span className="cancel-purchase__refund-domain-info">
									{ translate(
										"You'll receive a partial refund of %(refundAmount)s -- the cost of the %(productName)s " +
											'plan, minus %(domainCost)s for the domain. There will be no change to your domain ' +
											"registration, and you're free to use it on WordPress.com or transfer it elsewhere.",
										{
											args: {
												productName: getName( purchase ),
												domainCost: includedDomainPurchase.costToUnbundleText,
												refundAmount: purchase.refundText,
											},
										}
									) }
								</span>
							</>
						}
					/>
				</FormLabel>
			</CompactCard>
			<CompactCard>
				<FormLabel key="cancel_bundled_domain">
					<FormRadio
						name="cancel_bundled_domain_false"
						value="cancel"
						checked={ cancelBundledDomain }
						onChange={ onCancelBundledDomainChange }
						disabled={ isLoading }
						label={
							<>
								{ translate( 'Cancel the plan {{strong}}and{{/strong}} the domain "%(domain)s"', {
									args: {
										domain: includedDomainPurchase.meta,
									},
									components: {
										strong: <strong />,
									},
								} ) }
								<br />
								<span className="cancel-purchase__refund-domain-info">
									{ translate(
										"You'll receive a full refund of %(planCost)s. The domain will be cancelled, and it's possible " +
											"you'll lose it permanently.",
										{
											args: {
												planCost: purchase.totalRefundText,
											},
										}
									) }
								</span>
							</>
						}
					/>
				</FormLabel>
			</CompactCard>
			{ cancelBundledDomain && (
				<span className="cancel-purchase__domain-warning">
					{ translate(
						"When you cancel a domain, it becomes unavailable for a while. Anyone may register it once it's " +
							"available again, so it's possible you won't have another chance to register it in the future. " +
							"If you'd like to use your domain on a site hosted elsewhere, consider {{a}}updating your name " +
							'servers{{/a}} instead.',
						{
							components: {
								a: (
									<a
										href={ localizeUrl( UPDATE_NAMESERVERS ) }
										target="_blank"
										rel="noopener noreferrer"
									/>
								),
							},
						}
					) }
					<FormLabel>
						<FormCheckbox
							checked={ confirmCancel }
							onChange={ onConfirmCancelBundledDomainChange }
							disabled={ isLoading }
						/>
						<span className="cancel-purchase__domain-confirm">
							{ translate(
								'I understand that canceling my domain means I might {{strong}}never be able to register it ' +
									'again{{/strong}}.',
								{
									components: {
										strong: <strong />,
									},
								}
							) }
						</span>
					</FormLabel>
				</span>
			) }

			<h2 className="formatted-header__title formatted-header__title--cancellation-flow">
				{ translate( 'What happens when you cancel' ) }
			</h2>
		</div>
	);
};

export default CancelPurchaseDomainOptions;
