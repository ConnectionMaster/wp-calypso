import { formatNumber } from '@automattic/number-formatters';
import { useRef } from 'react';
import SectionNav from 'calypso/components/section-nav';
import NavItem from 'calypso/components/section-nav/item';
import NavTabs from 'calypso/components/section-nav/tabs';
import { TabOption, TabType } from 'calypso/my-sites/promote-post-i2/main';
import { useSelector } from 'calypso/state';
import { getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import { getAdvertisingDashboardPath } from '../../utils';

type Props = {
	tabs: TabOption[];
	selectedTab: TabType;
};

export default function PromotePostTabBar( { tabs, selectedTab }: Props ) {
	const selectedSiteSlug = useSelector( getSelectedSiteSlug );

	// Smooth horizontal scrolling on mobile views
	const tabsRef = useRef< { [ key: string ]: HTMLSpanElement | null } >( {} );
	const onTabClick = ( key: string ) => {
		tabsRef.current[ key ]?.scrollIntoView( {
			behavior: 'smooth',
			block: 'nearest',
			inline: 'center',
		} );
	};
	const selectedLabel = tabs.find( ( tab ) => tab.id === selectedTab )?.name;

	return (
		<SectionNav selectedText={ selectedLabel }>
			<NavTabs>
				{ tabs
					.filter( ( { enabled = true } ) => enabled )
					.map( ( { id, name, itemCount, isCountAmount, className, label = '' } ) => {
						return (
							<NavItem
								key={ id }
								path={ getAdvertisingDashboardPath( `/${ id }/${ selectedSiteSlug }` ) }
								selected={ selectedTab === id }
								className={ className }
								onClick={ () => onTabClick( id ) }
							>
								<span ref={ ( el ) => ( tabsRef.current[ id ] = el ) }>{ name }</span>
								{ itemCount && itemCount !== 0 ? (
									<span className="count">
										{ isCountAmount ? '$' : null }
										{ formatNumber( itemCount, { decimals: isCountAmount ? 2 : 0 } ) }
										<span className="sr-only">{ label }</span>
									</span>
								) : null }
							</NavItem>
						);
					} ) }
			</NavTabs>
		</SectionNav>
	);
}
