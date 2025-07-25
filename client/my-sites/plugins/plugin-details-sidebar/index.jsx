import {
	isFreePlanProduct,
	FEATURE_INSTALL_PLUGINS,
	WPCOM_FEATURES_INSTALL_PURCHASED_PLUGINS,
} from '@automattic/calypso-products';
import { localizeUrl } from '@automattic/i18n-utils';
import { sprintf } from '@wordpress/i18n';
import { useTranslate } from 'i18n-calypso';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import './style.scss';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { PlanUSPS, USPS } from 'calypso/my-sites/plugins/plugin-details-CTA/usps';
import PluginDetailsSidebarUSP, {
	PLUGIN_DETAILS_LINK_TYPES,
} from 'calypso/my-sites/plugins/plugin-details-sidebar-usp';
import usePluginsSupportText from 'calypso/my-sites/plugins/use-plugins-support-text';
import { getBillingInterval } from 'calypso/state/marketplace/billing-interval/selectors';
import isSiteAutomatedTransfer from 'calypso/state/selectors/is-site-automated-transfer';
import siteHasFeature from 'calypso/state/selectors/site-has-feature';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import { getSelectedSite } from 'calypso/state/ui/selectors';

const PluginDetailsSidebar = ( {
	plugin: {
		slug,
		tested,
		isMarketplaceProduct = false,
		demo_url = null,
		documentation_url = null,
		requirements = {},
		premium_slug,
	},
} ) => {
	const translate = useTranslate();

	const selectedSite = useSelector( getSelectedSite );
	const isJetpack = useSelector( ( state ) => isJetpackSite( state, selectedSite?.ID ) );
	const isAtomic = useSelector( ( state ) => isSiteAutomatedTransfer( state, selectedSite?.ID ) );
	const isJetpackSelfHosted = selectedSite && isJetpack && ! isAtomic;
	const billingPeriod = useSelector( getBillingInterval );
	const isFreePlan = selectedSite && isFreePlanProduct( selectedSite.plan );
	const pluginFeature = isMarketplaceProduct
		? WPCOM_FEATURES_INSTALL_PURCHASED_PLUGINS
		: FEATURE_INSTALL_PLUGINS;
	const shouldUpgrade =
		useSelector( ( state ) => ! siteHasFeature( state, selectedSite?.ID, pluginFeature ) ) &&
		! isJetpackSelfHosted;

	const isWooCommercePluginRequired = requirements.plugins?.some(
		( pluginName ) => pluginName === 'plugins/woocommerce'
	);

	const supportText = usePluginsSupportText();

	const supportLinks = [
		{
			supportContext: 'general-support-options',
			label: translate( 'How to get help!' ),
			openIn: PLUGIN_DETAILS_LINK_TYPES.HELP_CENTER,
		},
		{
			href: localizeUrl( 'https://automattic.com/privacy/' ),
			label: translate( 'See privacy policy' ),
			openIn: PLUGIN_DETAILS_LINK_TYPES.NEW_TAB,
		},
	];
	documentation_url &&
		supportLinks.unshift( {
			href: documentation_url,
			label: translate( 'View documentation' ),
			openIn: PLUGIN_DETAILS_LINK_TYPES.NEW_TAB,
		} );

	const isPremiumVersionAvailable = !! premium_slug;
	const premiumVersionLink = `/plugins/${ premium_slug }/${ selectedSite?.slug || '' }`;
	const premiumVersionLinkOnClik = useCallback( () => {
		recordTracksEvent( 'calypso_plugin_details_premium_plugin_link_click', {
			current_plugin_slug: slug,
			premium_plugin_slug: premium_slug,
			site: selectedSite?.ID,
		} );
	}, [ premium_slug, selectedSite?.ID, slug ] );

	return (
		<div className="plugin-details-sidebar__plugin-details-content">
			{ isPremiumVersionAvailable && (
				<PluginDetailsSidebarUSP
					id="demo"
					title={ translate( 'Premium version available' ) }
					description={ translate(
						'This plugin has a premium version that might suit your needs better.'
					) }
					links={ [
						{
							href: premiumVersionLink,
							label: translate( 'Learn more' ),
							onClick: premiumVersionLinkOnClik,
						},
					] }
					first
				/>
			) }
			{ isWooCommercePluginRequired && (
				<PluginDetailsSidebarUSP
					id="woo"
					title={ translate( 'Your store foundations' ) }
					description={ translate(
						'This plugin requires WooCommerce to work.{{br/}}If you do not have it installed, it will be installed automatically for free.',
						{
							components: {
								br: <br />,
							},
						}
					) }
					first={ ! isPremiumVersionAvailable }
				/>
			) }
			{ selectedSite && (
				<USPS
					shouldUpgrade={ shouldUpgrade }
					isFreePlan={ isFreePlan }
					isMarketplaceProduct={ isMarketplaceProduct }
					billingPeriod={ billingPeriod }
				/>
			) }
			{ selectedSite && (
				<PlanUSPS
					pluginSlug={ slug }
					shouldUpgrade={ shouldUpgrade }
					isFreePlan={ isFreePlan }
					isMarketplaceProduct={ isMarketplaceProduct }
					billingPeriod={ billingPeriod }
				/>
			) }
			{ demo_url && (
				<PluginDetailsSidebarUSP
					id="demo"
					title={ translate( 'Try it before you buy it' ) }
					description={ translate(
						'Take a look at the posibilities of this plugin before your commit.'
					) }
					links={ [
						{
							href: { demo_url },
							label: translate( 'View live demo' ),
							openIn: PLUGIN_DETAILS_LINK_TYPES.NEW_TAB,
						},
					] }
					first
				/>
			) }
			{ isMarketplaceProduct && (
				<PluginDetailsSidebarUSP
					id="support"
					title={ translate( 'Support' ) }
					description={ supportText }
					links={ supportLinks }
					first
				/>
			) }
			{ Boolean( tested ) && (
				<div className="plugin-details-sidebar__tested">
					<div className="plugin-details-sidebar__tested-text title">
						{ translate( 'Tested up to' ) }
					</div>
					<div className="plugin-details-sidebar__tested-value value">
						{ sprintf( 'WordPress %s', tested ) }
					</div>
				</div>
			) }
		</div>
	);
};

export default PluginDetailsSidebar;
