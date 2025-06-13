import { formatCurrency } from '@automattic/number-formatters';
import { useQuery } from '@tanstack/react-query';
import {
	__experimentalText as Text,
	__experimentalVStack as VStack,
	Button,
	ExternalLink,
} from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { siteAgencyBlogQuery } from '../../app/queries/site-agency';
import { siteDomainsQuery } from '../../app/queries/site-domains';
import Notice from '../../components/notice';
import {
	isSitePlanBigSkyTrial,
	isSitePlanHostingTrial,
	isSitePlanPaid,
} from '../../utils/site-plans';
import type { AgencyBlog, Site } from '../../data/types';

function getAgencyBillingMessage( agency: AgencyBlog | undefined, isAgencyQueryError: boolean ) {
	if ( ! agency ) {
		return undefined;
	}

	const priceInfoIsDefined =
		Number.isFinite( agency.prices?.actual_price ) && typeof agency.prices?.currency === 'string';

	if ( isAgencyQueryError || ! priceInfoIsDefined ) {
		return __( 'After launch, we’ll bill your agency in the next billing cycle.' );
	}

	const { existing_wpcom_license_count: existingWPCOMLicenseCount = 0, name, prices } = agency;
	const price = formatCurrency( prices.actual_price, prices.currency );

	return createInterpolateElement(
		sprintf(
			/* translators: agencyName is the name of the agency that will be billed for the site; licenseCount is the number of licenses the agency will be billed for; price is the price per license */
			_n(
				'After launch, we’ll bill %(agencyName)s in the next billing cycle. With %(licenseCount)d production hosting license, you will be charged %(price)s / license / month. <learnMoreLink>Learn more</learnMoreLink>',
				'After launch, we’ll bill %(agencyName)s in the next billing cycle. With %(licenseCount)d production hosting licenses, you will be charged %(price)s / license / month. <learnMoreLink>Learn more</learnMoreLink>',
				existingWPCOMLicenseCount + 1
			),
			{
				agencyName: name,
				licenseCount: existingWPCOMLicenseCount + 1,
				price,
			}
		),
		{
			learnMoreLink: (
				<ExternalLink
					href="https://agencieshelp.automattic.com/knowledge-base/free-development-licenses-for-wordpress-com-hosting/"
					children={ null }
				/>
			),
		}
	);
}

export function LaunchAgencyDevelopmentSiteForm( {
	site,
	onLaunchClick,
}: {
	site: Site;
	onLaunchClick: () => void;
} ) {
	const { data, isError } = useQuery( siteAgencyBlogQuery( site.ID ) );

	const billingMessage = getAgencyBillingMessage( data, isError );
	const isReferralStatusActive = data?.referral_status === 'active';
	const shouldShowBillingMessage = ! isReferralStatusActive && !! billingMessage;
	const shouldShowReferClientButton = ! isReferralStatusActive;

	return (
		<Notice
			title={ __( 'Your site hasn’t been launched yet' ) }
			actions={
				<>
					<Button size="compact" variant="primary" onClick={ () => onLaunchClick() }>
						{ __( 'Launch site' ) }
					</Button>
					{ shouldShowReferClientButton && (
						<Button
							size="compact"
							variant="secondary"
							href={ `https://agencies.automattic.com/marketplace/checkout?referral_blog_id=${ site.ID }` }
						>
							{ __( 'Refer a client' ) }
						</Button>
					) }
				</>
			}
		>
			<VStack spacing={ 5 } alignment="left">
				<Text as="p">
					{ __( 'It is hidden from visitors behind a “Coming Soon” notice until it is launched.' ) }
				</Text>
				{ shouldShowBillingMessage && <Text as="p">{ billingMessage }</Text> }
			</VStack>
		</Notice>
	);
}

export function LaunchForm( {
	site,
	isLaunching,
	onLaunchClick,
}: {
	site: Site;
	isLaunching: boolean;
	onLaunchClick: () => void;
} ) {
	const { data: domains = [], isLoading } = useQuery( siteDomainsQuery( site.ID ) );
	if ( isLoading ) {
		return null;
	}

	const isSitePlanPaidWithDomains = isSitePlanPaid( site ) && domains.length > 1;
	const shouldImmediatelyLaunch = isSitePlanPaidWithDomains || isSitePlanHostingTrial( site );

	const getLaunchUrl = () => {
		if ( isSitePlanBigSkyTrial( site ) ) {
			return addQueryArgs( '/setup/ai-site-builder/domains', {
				siteId: site.ID,
				source: 'general-settings',
				redirect: 'site-launch',
				new: site.name,
				search: 'yes',
			} );
		}

		return addQueryArgs( '/start/launch-site', {
			siteSlug: site.slug,
			new: site.name,
			hide_initial_query: 'yes',
		} );
	};

	const renderButton = () => {
		if ( shouldImmediatelyLaunch ) {
			return (
				<Button size="compact" variant="primary" isBusy={ isLaunching } onClick={ onLaunchClick }>
					{ __( 'Launch site' ) }
				</Button>
			);
		}

		return (
			<Button size="compact" variant="primary" href={ getLaunchUrl() }>
				{ __( 'Launch site' ) }
			</Button>
		);
	};

	return (
		<Notice title={ __( 'Your site hasn’t been launched yet' ) } actions={ renderButton() }>
			{ __( 'It is hidden from visitors behind a “Coming Soon” notice until it is launched.' ) }
		</Notice>
	);
}
