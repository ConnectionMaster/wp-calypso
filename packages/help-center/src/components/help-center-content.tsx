/* eslint-disable no-restricted-imports */
/**
 * External Dependencies
 */
import { recordTracksEvent } from '@automattic/calypso-analytics';
import { CardBody, Disabled } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import React from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
/**
 * Internal Dependencies
 */
import { useHelpCenterContext } from '../contexts/HelpCenterContext';
import { useSupportStatus } from '../data/use-support-status';
import { HELP_CENTER_STORE } from '../stores';
import { HelpCenterArticle } from './help-center-article';
import { HelpCenterChat } from './help-center-chat';
import { HelpCenterChatHistory } from './help-center-chat-history';
import { HelpCenterContactForm } from './help-center-contact-form';
import { HelpCenterSearch } from './help-center-search';
import { SuccessScreen } from './ticket-success-screen';
import type { HelpCenterSelect } from '@automattic/data-stores';

import './help-center-content.scss';

// Disabled component only applies the class if isDisabled is true, we want it always.
function Wrapper( {
	isDisabled,
	className,
	children,
}: React.PropsWithChildren< { isDisabled: boolean; className: string } > ) {
	if ( isDisabled ) {
		return (
			<Disabled isDisabled={ isDisabled } className={ className }>
				{ children }
			</Disabled>
		);
	}
	return <div className={ className }>{ children }</div>;
}

const HelpCenterContent: React.FC< { isRelative?: boolean; currentRoute?: string } > = ( {
	currentRoute,
} ) => {
	const location = useLocation();
	const containerRef = useRef< HTMLDivElement >( null );
	const navigate = useNavigate();
	const { setNavigateToRoute } = useDispatch( HELP_CENTER_STORE );
	const { sectionName } = useHelpCenterContext();
	const { data, isLoading: isLoadingSupportStatus } = useSupportStatus();

	const { navigateToRoute, isMinimized, allowPremiumSupport } = useSelect( ( select ) => {
		const store = select( HELP_CENTER_STORE ) as HelpCenterSelect;
		return {
			navigateToRoute: store.getNavigateToRoute(),
			isMinimized: store.getIsMinimized(),
			allowPremiumSupport: store.getAllowPremiumSupport(),
		};
	}, [] );
	const isUserEligibleForPaidSupport =
		Boolean( data?.eligibility?.is_user_eligible ) || allowPremiumSupport;

	const userFieldFlowName = data?.eligibility?.user_field_flow_name;

	useEffect( () => {
		recordTracksEvent( 'calypso_helpcenter_page_open', {
			pathname: location.pathname,
			search: location.search,
			section: sectionName,
			force_site_id: true,
			location: 'help-center',
			is_free_user: ! isUserEligibleForPaidSupport,
		} );
	}, [ location, sectionName, isUserEligibleForPaidSupport ] );

	useEffect( () => {
		if ( navigateToRoute ) {
			const fullLocation = [ location.pathname, location.search, location.hash ].join( '' );
			// On navigate once to keep the back button responsive.
			if ( fullLocation !== navigateToRoute ) {
				navigate( navigateToRoute );
			}
			setNavigateToRoute( null );
		}
	}, [ navigate, navigateToRoute, setNavigateToRoute, location ] );

	useEffect( () => {
		if (
			containerRef.current &&
			! location.hash &&
			! location.pathname.includes( '/odie' ) &&
			! location.pathname.includes( '/post' )
		) {
			containerRef.current.scrollTo( 0, 0 );
		}
	}, [ location ] );

	return (
		<CardBody ref={ containerRef } className="help-center__container-content">
			<Wrapper isDisabled={ isMinimized } className="help-center__container-content-wrapper">
				<Routes>
					<Route path="/" element={ <HelpCenterSearch currentRoute={ currentRoute } /> } />
					<Route path="/post" element={ <HelpCenterArticle /> } />
					<Route path="/contact-form" element={ <HelpCenterContactForm /> } />
					<Route path="/success" element={ <SuccessScreen /> } />
					<Route
						path="/odie"
						element={
							<HelpCenterChat
								isLoadingStatus={ isLoadingSupportStatus }
								isUserEligibleForPaidSupport={ isUserEligibleForPaidSupport }
								userFieldFlowName={ userFieldFlowName }
							/>
						}
					/>
					<Route path="/chat-history" element={ <HelpCenterChatHistory /> } />
				</Routes>
			</Wrapper>
		</CardBody>
	);
};

export default HelpCenterContent;
