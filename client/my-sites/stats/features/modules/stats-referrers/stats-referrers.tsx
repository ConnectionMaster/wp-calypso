import { StatsCard } from '@automattic/components';
import { megaphone } from '@wordpress/icons';
import { useTranslate } from 'i18n-calypso';
import { useSelector } from 'react-redux';
import QuerySiteStats from 'calypso/components/data/query-site-stats';
import InlineSupportLink from 'calypso/components/inline-support-link';
import StatsInfoArea from 'calypso/my-sites/stats/features/modules/shared/stats-info-area';
import { useShouldGateStats } from 'calypso/my-sites/stats/hooks/use-should-gate-stats';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import {
	isRequestingSiteStatsForQuery,
	getSiteStatsNormalizedData,
} from 'calypso/state/stats/lists/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import EmptyModuleCard from '../../../components/empty-module-card/empty-module-card';
import StatsModule from '../../../stats-module';
import { StatsEmptyActionSocial } from '../shared';
import StatsCardSkeleton from '../shared/stats-card-skeleton';
import type { StatsDefaultModuleProps, StatsStateProps } from '../types';

const StatsReferrers: React.FC< StatsDefaultModuleProps > = ( {
	period,
	query,
	moduleStrings,
	className,
	summaryUrl,
	summary,
	listItemClassName,
	isRealTime = false,
} ) => {
	const translate = useTranslate();
	const siteId = useSelector( getSelectedSiteId ) as number;
	const statType = 'statsReferrers';

	const isSiteJetpackNotAtomic = useSelector( ( state ) =>
		isJetpackSite( state, siteId, { treatAtomicAsJetpackSite: false } )
	);
	const supportContext = isSiteJetpackNotAtomic ? 'stats-referrers-jetpack' : 'stats-referrers';

	// Use StatsModule to display paywall upsell.
	const shouldGateStatsModule = useShouldGateStats( statType );

	const isRequestingData = useSelector( ( state: StatsStateProps ) =>
		isRequestingSiteStatsForQuery( state, siteId, statType, query )
	);
	const data = useSelector( ( state ) =>
		getSiteStatsNormalizedData( state, siteId, statType, query )
	) as [ id: number, label: string ]; // TODO: get post shape and share in an external type file.

	// TODO: Consolidate presentation logic.
	// This code is copied directly from StatsTopPosts.
	const hasData = !! data?.length;
	// TODO: Is there a way to show the Skeleton loader for real-time data?
	// We don't want it to show every time a rquest is being run for real-time data so it's disabled for now.
	const presentLoadingUI = isRealTime
		? isRequestingData && ! hasData && false
		: isRequestingData && ! shouldGateStatsModule;
	const presentModuleUI = isRealTime
		? hasData && ! presentLoadingUI
		: ( ! isRequestingData && hasData ) || shouldGateStatsModule;
	const presentEmptyUI = isRealTime
		? ! hasData && ! presentLoadingUI
		: ! isRequestingData && ! hasData && ! shouldGateStatsModule;

	return (
		<>
			{ ! shouldGateStatsModule && siteId && statType && (
				<QuerySiteStats statType={ statType } siteId={ siteId } query={ query } />
			) }
			{ presentLoadingUI && (
				<StatsCardSkeleton
					isLoading={ isRequestingData }
					className={ className }
					title={ moduleStrings.title }
					type={ 2 }
				/>
			) }
			{ presentModuleUI && (
				// show data or an overlay
				<StatsModule
					path="referrers"
					titleNodes={
						<StatsInfoArea>
							{ translate(
								'Websites {{link}}referring visitors{{/link}} sorted by most clicked. Learn about where your audience comes from.',
								{
									comment: '{{link}} links to support documentation.',
									components: {
										link: (
											<InlineSupportLink supportContext={ supportContext } showIcon={ false } />
										),
									},
									context: 'Stats: Link in a popover for the Referrers when the module has data',
								}
							) }
						</StatsInfoArea>
					}
					moduleStrings={ moduleStrings }
					period={ period }
					query={ query }
					statType={ statType }
					showSummaryLink={ !! summary }
					className={ className }
					summary={ summary }
					listItemClassName={ listItemClassName }
					skipQuery
					isRealTime={ isRealTime }
				/>
			) }
			{ presentEmptyUI && (
				// show empty state
				<StatsCard
					className={ className }
					title={ moduleStrings.title }
					isEmpty
					emptyMessage={
						<EmptyModuleCard
							icon={ megaphone }
							description={ translate(
								"We'll show you which websites are {{link}}referring visitors{{/link}} to your site so you can discover where your audience comes from. Start sharing!",
								{
									comment: '{{link}} links to support documentation.',
									components: {
										link: (
											<InlineSupportLink supportContext={ supportContext } showIcon={ false } />
										),
									},
									context: 'Stats: Info box label when the Referrers module is empty',
								}
							) }
							cards={ <StatsEmptyActionSocial from="module_referrers" /> }
						/>
					}
					footerAction={
						summaryUrl
							? {
									url: summaryUrl,
									label: translate( 'View more' ),
							  }
							: undefined
					}
				/>
			) }
		</>
	);
};

export default StatsReferrers;
