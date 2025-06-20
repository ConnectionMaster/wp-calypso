import page from '@automattic/calypso-router';
import { SimplifiedSegmentedControl, StatsCard } from '@automattic/components';
import { mapMarker } from '@wordpress/icons';
import { useTranslate } from 'i18n-calypso';
import { useState, useEffect, useMemo } from 'react';
import QuerySiteStats from 'calypso/components/data/query-site-stats';
import InlineSupportLink from 'calypso/components/inline-support-link';
import useLocationViewsQuery, {
	StatsLocationViewsData,
} from 'calypso/my-sites/stats/hooks/use-location-views-query';
import { useShouldGateStats } from 'calypso/my-sites/stats/hooks/use-should-gate-stats';
import StatsCardUpsell from 'calypso/my-sites/stats/stats-card-upsell';
import StatsListCard from 'calypso/my-sites/stats/stats-list/stats-list-card';
import StatsModulePlaceholder from 'calypso/my-sites/stats/stats-module/placeholder';
import {
	getPathWithUpdatedQueryString,
	trackStatsAnalyticsEvent,
} from 'calypso/my-sites/stats/utils';
import { useDispatch, useSelector } from 'calypso/state';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import getEnvStatsFeatureSupportChecks from 'calypso/state/sites/selectors/get-env-stats-feature-supports';
import { receiveSiteStats } from 'calypso/state/stats/lists/actions';
import { getSiteStatsNormalizedData } from 'calypso/state/stats/lists/selectors';
import { normalizers } from 'calypso/state/stats/lists/utils';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import EmptyModuleCard from '../../../components/empty-module-card/empty-module-card';
import { STAT_TYPE_COUNTRY_VIEWS } from '../../../constants';
import Geochart from '../../../geochart';
import StatsCardUpdateJetpackVersion from '../../../stats-card-upsell/stats-card-update-jetpack-version';
import StatsCardSkeleton from '../shared/stats-card-skeleton';
import StatsInfoArea from '../shared/stats-info-area';
import { StatsDefaultModuleProps, StatsQueryType } from '../types';
import CountryFilter from './country-filter';
import sampleLocations from './sample-locations';
import { OPTION_KEYS, UrlGeoMode, GEO_MODES } from './types';
import useOptionLabels from './use-option-labels';

import './style.scss';

type SelectOptionType = {
	label: string;
	value: string;
};

interface StatsModuleLocationsProps extends StatsDefaultModuleProps {
	initialGeoMode?: string;
	query: StatsQueryType & { geoMode?: UrlGeoMode };
}

const StatsLocations: React.FC< StatsModuleLocationsProps > = ( {
	initialGeoMode,
	query,
	summaryUrl,
	summary = false,
	listItemClassName,
} ) => {
	const dispatch = useDispatch();
	const translate = useTranslate();
	const siteId = useSelector( getSelectedSiteId ) as number;
	const statType = STAT_TYPE_COUNTRY_VIEWS;

	const isSiteJetpackNotAtomic = useSelector( ( state ) =>
		isJetpackSite( state, siteId, { treatAtomicAsJetpackSite: false } )
	);
	const supportContext = isSiteJetpackNotAtomic ? 'stats-locations-jetpack' : 'stats-locations';

	// selectOption is in plural form i.e. 'countries'! Possible something to unify in the future.
	const appliedGeoModeFromUrl = useMemo( () => {
		const urlGeoMode = query.geoMode ?? initialGeoMode;
		return urlGeoMode && urlGeoMode in GEO_MODES ? urlGeoMode : OPTION_KEYS.COUNTRIES;
	}, [ query.geoMode, initialGeoMode ] );

	const [ countryFilter, setCountryFilter ] = useState< string | null >( null );

	// Set the state locally to avoid a page being reloaded by URL changes.
	const [ selectedLocalOption, setSelectedLocalOption ] = useState( () => {
		return appliedGeoModeFromUrl;
	} );

	const selectedOption = useMemo( () => {
		if ( summary ) {
			return appliedGeoModeFromUrl;
		}

		return selectedLocalOption;
	}, [ summary, appliedGeoModeFromUrl, selectedLocalOption ] );

	const optionLabels = useOptionLabels();

	// Use StatsModule to display paywall upsell.
	const shouldGateStatsModule = useShouldGateStats( statType );
	const shouldGateTab = useShouldGateStats( optionLabels[ selectedOption ].feature );
	const shouldGate = shouldGateStatsModule || shouldGateTab;
	// Mapping plural to singular form where all other places are using.
	const geoMode = GEO_MODES[ selectedOption ];
	const title = translate( 'Locations' );

	const { supportsLocationsStats: supportsLocationsStatsFeature } = useSelector( ( state ) =>
		getEnvStatsFeatureSupportChecks( state, siteId )
	);

	// Main location data query
	const {
		data: locationsViewsData,
		isLoading: isRequestingData,
		isError,
	} = useLocationViewsQuery< StatsLocationViewsData >( siteId, geoMode, query, countryFilter, {
		enabled: ! shouldGate && supportsLocationsStatsFeature,
	} );

	const normalizedLocationsViewsData = useMemo( () => {
		if ( isRequestingData || ! locationsViewsData ) {
			return [];
		}

		const normalizedStats = normalizers.statsCountryViews(
			locationsViewsData as StatsLocationViewsData,
			query
		);

		if ( ! Array.isArray( normalizedStats ) ) {
			return [];
		}

		return query?.max ? normalizedStats.slice( 0, query.max ) : normalizedStats;
	}, [ locationsViewsData, query, isRequestingData ] );

	// The legacy endpoint that only supports countries (not regions or cities)
	// will be used when the new Locations Stats feature is not available.
	const legacyCountriesViewsData = useSelector( ( state ) =>
		getSiteStatsNormalizedData( state, siteId, statType, query )
	) as [ id: number, label: string ];

	const data = supportsLocationsStatsFeature
		? normalizedLocationsViewsData
		: legacyCountriesViewsData;

	// Only fetch separate countries list if we're not already in country tab
	// This is to avoid fetching the same data twice.
	const { data: countriesList, isLoading: isRequestingCountriesList } =
		useLocationViewsQuery< StatsLocationViewsData >( siteId, 'country', query, null, {
			enabled: ! shouldGate && supportsLocationsStatsFeature && geoMode !== 'country',
		} );

	const normalizedCountriesList = useMemo( () => {
		if ( isRequestingCountriesList || ! countriesList ) {
			return [];
		}

		const normalizedStats = normalizers.statsCountryViews(
			countriesList as StatsLocationViewsData,
			query
		);

		if ( ! Array.isArray( normalizedStats ) ) {
			return [];
		}

		return normalizedStats;
	}, [ countriesList, query, isRequestingCountriesList ] );

	useEffect( () => {
		if ( isRequestingCountriesList || isRequestingData || isRequestingCountriesList ) {
			return;
		}

		let dataToDispatch;
		if ( geoMode === 'country' ) {
			dataToDispatch = countriesList;
		} else {
			dataToDispatch = locationsViewsData;
		}

		if ( dataToDispatch ) {
			dispatch(
				receiveSiteStats( siteId, 'statsCountryViews', query, dataToDispatch, Date.now() )
			);
		}
	}, [
		countriesList,
		geoMode,
		locationsViewsData,
		isRequestingCountriesList,
		isRequestingData,
		dispatch,
		query,
		siteId,
	] );

	const onCountryChange = ( value: string ) => {
		trackStatsAnalyticsEvent( 'stats_locations_module_country_filter_changed', {
			stat_type: optionLabels[ selectedOption ].feature,
			country: value,
		} );

		setCountryFilter( value );
	};

	const changeViewButton = ( selection: SelectOptionType ) => {
		const filter = selection.value;
		trackStatsAnalyticsEvent( 'stats_locations_module_menu_clicked', {
			stat_type: optionLabels[ filter ].feature,
		} );

		if ( summary ) {
			page( getPathWithUpdatedQueryString( { geoMode: filter } ) );
		} else {
			setSelectedLocalOption( filter );
		}
	};

	const onShowMoreClick = () => {
		trackStatsAnalyticsEvent( 'stats_locations_module_show_more_clicked', {
			stat_type: optionLabels[ selectedOption ].feature,
		} );
	};

	// Need to keep the old tabs on Traffic page.
	const toggleControlComponent = ! summary && (
		<>
			<SimplifiedSegmentedControl
				className="stats-module-locations__tabs"
				options={ Object.entries( optionLabels ).map( ( entry ) => ( {
					value: entry[ 0 ], // optionLabels key
					label: entry[ 1 ].selectLabel, // optionLabels object value
				} ) ) }
				initialSelected={ selectedOption }
				onSelect={ changeViewButton }
			/>
		</>
	);

	const emptyMessage = (
		<EmptyModuleCard
			icon={ mapMarker }
			description={ translate(
				'Stats on visitors and their {{link}}viewing location{{/link}} will appear here to learn from where you are getting visits.',
				{
					comment: '{{link}} links to support documentation.',
					components: {
						link: <InlineSupportLink supportContext={ supportContext } showIcon={ false } />,
					},
					context: 'Stats: Info box label when the Countries module is empty',
				}
			) }
		/>
	);

	const divisionsTooltip = (
		<StatsInfoArea>
			{ translate(
				'Countries and their subdivisions are based on {{link}}ISO 3166{{/link}} standards.',
				{
					comment: '{{link}} links to ISO standards.',
					components: {
						link: (
							<a
								target="_blank"
								rel="noreferrer"
								href="https://www.iso.org/maintenance_agencies.html#72482"
							/>
						),
					},
					context: 'Stats: Link in a popover for Regions/Cities module when the module has data',
				}
			) }
		</StatsInfoArea>
	);

	const titleTooltip = (
		<StatsInfoArea>
			{ translate(
				'Visitors’ {{link}}viewing location{{/link}} by countries, regions and cities.',
				{
					comment: '{{link}} links to support documentation.',
					components: {
						link: <InlineSupportLink supportContext={ supportContext } showIcon={ false } />,
					},
					context: 'Stats: Link in a popover for Countries module when the module has data',
				}
			) }
		</StatsInfoArea>
	);

	const showJetpackUpgradePrompt = geoMode !== 'country' && ! supportsLocationsStatsFeature;

	const showUpsell = shouldGate || showJetpackUpgradePrompt;

	const locationData = showUpsell ? sampleLocations : data;
	const hasLocationData = Array.isArray( locationData ) && locationData.length > 0;

	const heroElementActions = (
		<div className="stats-module-locations__actions">
			{ geoMode !== 'country' && (
				<CountryFilter
					countries={ normalizedCountriesList }
					defaultLabel={ optionLabels[ selectedOption ].countryFilterLabel }
					selectedCountry={ countryFilter }
					onCountryChange={ onCountryChange }
					tooltip={ divisionsTooltip }
				/>
			) }
		</div>
	);

	const heroElement = (
		<>
			<Geochart data={ locationData } geoMode={ geoMode } skipQuery customHeight={ 480 } />
			{ ! summaryUrl && heroElementActions }
		</>
	);

	const getModuleOverlay = () => {
		if ( shouldGate ) {
			return (
				<StatsCardUpsell siteId={ siteId } statType={ optionLabels[ selectedOption ].feature } />
			);
		}

		if ( showJetpackUpgradePrompt ) {
			return <StatsCardUpdateJetpackVersion siteId={ siteId } statType="locations" />;
		}

		return null;
	};

	const getFinalSummaryUrl = () => {
		if ( ! summaryUrl ) {
			return undefined;
		}

		return getPathWithUpdatedQueryString(
			{
				geoMode: selectedOption,
			},
			summaryUrl
		);
	};

	const moduleOverlay = getModuleOverlay();

	return (
		<>
			{ ! shouldGate && ! supportsLocationsStatsFeature && geoMode === 'country' && (
				<QuerySiteStats statType={ statType } siteId={ siteId } query={ query } />
			) }
			{ isRequestingData && ! shouldGate && (
				<StatsCardSkeleton
					className="locations-skeleton"
					isLoading={ isRequestingData }
					title={ title }
					type={ 3 }
					withHero
					withSplitHeader
					toggleControl={ toggleControlComponent }
					mainItemLabel={ optionLabels[ selectedOption ]?.headerLabel }
					metricLabel={ translate( 'Views' ) }
					titleNodes={ titleTooltip }
				/>
			) }
			{ ( ( ! isRequestingData && ! isError && hasLocationData ) || shouldGate ) && (
				// show data or an overlay
				<>
					{ /* @ts-expect-error TODO: Refactor StatsListCard with TypeScript. */ }
					<StatsListCard
						title={ title }
						titleNodes={ titleTooltip }
						moduleType="locations"
						data={ locationData }
						emptyMessage={ emptyMessage }
						metricLabel={ translate( 'Views' ) }
						loader={ isRequestingData && <StatsModulePlaceholder isLoading={ isRequestingData } /> }
						splitHeader
						heroElement={ heroElement }
						mainItemLabel={ optionLabels[ selectedOption ]?.headerLabel }
						toggleControl={ toggleControlComponent }
						showMore={
							summaryUrl
								? {
										url: getFinalSummaryUrl(),
										label:
											Array.isArray( locationData ) && locationData.length >= 10
												? translate( 'View all', {
														context: 'Stats: Button link to show more detailed stats information',
												  } )
												: translate( 'View details', {
														context: 'Stats: Button label to see the detailed content of a panel',
												  } ),
								  }
								: undefined
						}
						onShowMoreClick={ onShowMoreClick }
						overlay={ moduleOverlay }
						listItemClassName={ listItemClassName }
					/>
				</>
			) }
			{ ! isRequestingData && ! hasLocationData && ! shouldGate && (
				// show empty state
				<StatsCard
					title={ title }
					isEmpty
					emptyMessage={ emptyMessage }
					footerAction={
						summaryUrl
							? {
									url: getFinalSummaryUrl(),
									label: translate( 'View more' ),
							  }
							: undefined
					}
				/>
			) }
		</>
	);
};

export default StatsLocations;
