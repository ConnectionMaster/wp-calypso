import { formatNumber } from '@automattic/number-formatters';
import { useTranslate } from 'i18n-calypso';
import { useMemo, useEffect } from 'react';
import JetpackColophon from 'calypso/components/jetpack-colophon';
import Main from 'calypso/my-sites/stats/components/stats-main';
import { useShouldGateStats } from 'calypso/my-sites/stats/hooks/use-should-gate-stats';
import { recordCurrentScreen } from 'calypso/my-sites/stats/hooks/use-stats-navigation-history';
import DownloadCsv from 'calypso/my-sites/stats/stats-download-csv';
import DownloadCsvUpsell from 'calypso/my-sites/stats/stats-download-csv-upsell';
import { useSelector } from 'calypso/state';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import PageHeader from '../components/headers/page-header';
import { STATS_FEATURE_DOWNLOAD_CSV } from '../constants';
import {
	TooltipWrapper,
	OpensTooltipContent,
	ClicksTooltipContent,
} from '../features/modules/stats-emails/tooltips';
import useStatsStrings from '../hooks/use-stats-strings';
import StatsModule from '../stats-module';
import PageViewTracker from '../stats-page-view-tracker';
import '../summary/style.scss';
import '../stats-module/summary-nav.scss';

// TODO: `query` was never passed from outside or defined in scope. Adding it to avoid a lint error.
const StatsEmailSummary = ( { period, query, context } ) => {
	const StatsStrings = useStatsStrings();
	const translate = useTranslate();
	const siteId = useSelector( getSelectedSiteId );
	const siteSlug = useSelector( ( state ) => getSelectedSiteSlug( state, siteId ) );
	const shouldGateCsvDownloads = useShouldGateStats( STATS_FEATURE_DOWNLOAD_CSV );

	// TODO: align with all summary pages.
	const navigationItems = useMemo( () => {
		const title = translate( 'Emails' );
		const localizedTabNames = {
			traffic: translate( 'Traffic' ),
			insights: translate( 'Insights' ),
			store: translate( 'Store' ),
			ads: translate( 'Ads' ),
			subscribers: translate( 'Subscribers' ),
		};
		const possibleBackLinks = {
			traffic: '/stats/day/',
			insights: '/stats/insights/',
			store: '/stats/store/',
			ads: '/stats/ads/',
			subscribers: '/stats/subscribers/',
		};
		// We track the parent tab via sessionStorage.
		const lastClickedTab = sessionStorage.getItem( 'jp-stats-last-tab' );
		const backLabel = localizedTabNames[ lastClickedTab ] || localizedTabNames.traffic;
		let backLink = possibleBackLinks[ lastClickedTab ] || possibleBackLinks.traffic;
		// Append the domain as needed.
		const domain = siteSlug;
		if ( domain?.length > 0 ) {
			backLink += domain;
		}

		// Wrap it up!
		return [ { label: backLabel, href: backLink }, { label: title } ];
	}, [ translate, siteSlug ] );

	useEffect( () => {
		recordCurrentScreen( 'emailsummary', {
			queryParams: context.query,
			period: period.period,
		} );
	}, [ context.query, period.period ] );

	const backLinkProps = {
		text: navigationItems[ 0 ].label,
		url: navigationItems[ 0 ].href,
	};
	const titleProps = {
		title: navigationItems[ 1 ].label,
		// Remove the default logo for Odyssey stats.
		titleLogo: null,
	};

	const downloadCsvElement = shouldGateCsvDownloads ? (
		<DownloadCsvUpsell siteId={ siteId } borderless />
	) : (
		<DownloadCsv
			statType="statsEmailsSummary"
			path="emails"
			query={ query }
			period={ period }
			headers={ [ 'title', 'opens_rate', 'unique_clicks', 'link' ] }
			rowModifierFn={ ( row, data ) => {
				if ( ! Array.isArray( row ) || row.length === 0 ) {
					return row;
				}

				const [ label, ...rest ] = row;
				return [ label, data.opens_rate, ...rest ];
			} }
		/>
	);

	return (
		<Main fullWidthLayout>
			<PageViewTracker path="/stats/emails/:site" title="Stats > Emails" />
			<div className="stats stats-summary-view">
				<PageHeader
					className="stats__section-header modernized-header"
					titleProps={ titleProps }
					backLinkProps={ backLinkProps }
					rightSection={
						<div className="stats-module__header-nav-button">{ downloadCsvElement }</div>
					}
				/>

				<div id="my-stats-content" className="stats-summary-view stats-summary__positioned">
					<div className="stats-summary-nav">
						<div className="stats-summary-nav__header">
							<div>
								<div className="stats-section-title">
									<h3>{ translate( 'Stats for Emails' ) }</h3>
								</div>
							</div>
						</div>
					</div>

					<StatsModule
						additionalColumns={ {
							header: (
								<>
									<span>{ translate( 'Opens' ) }</span>
								</>
							),
							body: ( item ) => {
								const opensUnique = parseInt( item.unique_opens, 10 );
								const opens = parseInt( item.opens, 10 );
								const hasUniquesData = opensUnique > 0 || opens === 0;
								return (
									<TooltipWrapper
										value={
											hasUniquesData
												? `${ formatNumber( item.opens_rate, {
														numberFormatOptions: {
															maximumFractionDigits: 2,
														},
												  } ) }%`
												: '—'
										}
										item={ item }
										TooltipContent={ OpensTooltipContent }
									/>
								);
							},
						} }
						path="emails"
						moduleStrings={ { ...StatsStrings.emails, title: '' } }
						period={ period }
						query={ query }
						statType="statsEmailsSummary"
						mainItemLabel={ translate( 'Latest Emails' ) }
						hideSummaryLink
						metricLabel={ translate( 'Clicks' ) }
						valueField="clicks_rate"
						formatValue={ ( value, item ) => {
							if ( item?.clicks !== undefined ) {
								const clicksUnique = parseInt( item.unique_clicks, 10 );
								const clicks = parseInt( item.clicks, 10 );
								const hasUniquesData = clicksUnique > 0 || clicks === 0;
								return (
									<TooltipWrapper
										value={
											hasUniquesData
												? `${ formatNumber( item.clicks_rate, {
														numberFormatOptions: {
															maximumFractionDigits: 2,
														},
												  } ) }%`
												: '—'
										}
										item={ item }
										TooltipContent={ ClicksTooltipContent }
									/>
								);
							}
							return <span>{ value }</span>;
						} }
						listItemClassName="stats__summary--narrow-mobile"
					/>
					<JetpackColophon />
				</div>
			</div>
		</Main>
	);
};

export default StatsEmailSummary;
