/* eslint-disable no-restricted-imports */
import { WordPressWordmark } from '@automattic/components';
import { useLocalizeUrl, useIsEnglishLocale, useLocale } from '@automattic/i18n-utils';
import { useI18n } from '@wordpress/react-i18n';
import { addQueryArgs } from '@wordpress/url';
import { useState, useEffect } from 'react';
import { HeaderProps } from '../types';
import { NonClickableItem, ClickableItem } from './menu-items';
import './style.scss';

const UniversalNavbarHeader = ( {
	className,
	hideGetStartedCta = false,
	isLoggedIn = false,
	sectionName,
	logoColor,
	variant = 'default',
	startUrl,
	loginUrl,
}: HeaderProps ) => {
	const locale = useLocale();
	const localizeUrl = useLocalizeUrl();
	const { __ } = useI18n();
	const [ isMobileMenuOpen, setMobileMenuOpen ] = useState( false );
	const isEnglishLocale = useIsEnglishLocale();
	// Allow tabbing in mobile version only when the menu is open
	const mobileMenuTabIndex = isMobileMenuOpen ? undefined : -1;

	// Handle dropdown management to ensure only one is open at a time
	useEffect( () => {
		const handleKeyDown = ( event: KeyboardEvent ) => {
			if ( event.key === 'Escape' ) {
				const activeElement = document.activeElement;
				if ( activeElement && activeElement.closest( '[role="menu"], .x-dropdown-content' ) ) {
					if ( activeElement instanceof HTMLElement ) {
						activeElement.blur();
					}
				}
			}
		};

		const closeOtherDropdowns = ( currentNavItem: Element ) => {
			document.querySelectorAll( '.x-nav-item__wide' ).forEach( ( item ) => {
				if ( item !== currentNavItem ) {
					const focusedElement = item.querySelector( ':focus' );
					if ( focusedElement instanceof HTMLElement ) {
						focusedElement.blur();
					}
				}
			} );
		};

		const handleInteraction = ( event: Event ) => {
			const target = event.target;
			if ( ! ( target instanceof HTMLElement ) ) {
				return;
			}

			const navItem = target.closest( '.x-nav-item__wide' );
			if ( navItem ) {
				closeOtherDropdowns( navItem );
			}
		};

		document.addEventListener( 'focusin', handleInteraction );
		document.addEventListener( 'mouseenter', handleInteraction, true );
		document.addEventListener( 'keydown', handleKeyDown );

		return () => {
			document.removeEventListener( 'focusin', handleInteraction );
			document.removeEventListener( 'mouseenter', handleInteraction, true );
			document.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [] );

	if ( ! startUrl ) {
		startUrl = addQueryArgs(
			// url
			sectionName === 'plugins'
				? localizeUrl( '//wordpress.com/start/business', locale, isLoggedIn )
				: localizeUrl( '//wordpress.com/start', locale, isLoggedIn ),
			// query
			sectionName
				? {
						ref: sectionName + '-lp',
				  }
				: {}
		);
	}

	return (
		<div className={ className }>
			<div className="x-root lpc-header-nav-wrapper">
				<div className="lpc-header-nav-container">
					{ /*<!-- Nav bar starts here. -->*/ }
					<div className="masterbar-menu">
						<div className="masterbar">
							<nav className="x-nav" aria-label="WordPress.com">
								<ul className="x-nav-list x-nav-list__left" role="menu">
									<li className="x-nav-item" role="none">
										<a
											role="menuitem"
											className="x-nav-link x-nav-link__logo x-link"
											href={ localizeUrl( '//wordpress.com' ) }
											target="_self"
										>
											<WordPressWordmark
												className="x-icon x-icon__logo"
												color={ logoColor ?? 'var(--studio-blue-50)' }
												size={ {
													width: 170,
													height: 36,
												} }
											/>
											<span className="x-hidden">WordPress.com</span>
										</a>
									</li>
									{ variant !== 'minimal' ? (
										<>
											<li className="x-nav-item x-nav-item__wide" role="none">
												<NonClickableItem
													className="x-nav-link x-link"
													content={ __( 'Products', __i18n_text_domain__ ) }
												/>
												<div
													className="x-dropdown-content"
													data-dropdown-name="products"
													role="menu"
													aria-label={ __( 'Products', __i18n_text_domain__ ) }
													aria-hidden="true"
												>
													<ul>
														<ClickableItem
															titleValue=""
															content={ __( 'WordPress Hosting', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/hosting/' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'WordPress for Agencies', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/for-agencies/' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Become an Affiliate', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/affiliates/' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Domain Names', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/domains/' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'AI Website Builder', __i18n_text_domain__ ) }
															urlValue={ localizeUrl(
																'//wordpress.com/ai-website-builder/?ref=topnav'
															) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Website Builder', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/website-builder/' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Create a Blog', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/create-blog/' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Newsletter', __i18n_text_domain__ ) }
															urlValue={ localizeUrl(
																'//wordpress.com/newsletter/',
																locale,
																isLoggedIn,
																true
															) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Professional Email', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/professional-email/' ) }
															type="dropdown"
															target="_self"
														/>
														{ isEnglishLocale && (
															<ClickableItem
																titleValue=""
																content={ __( 'Website Design Services', __i18n_text_domain__ ) }
																urlValue={ localizeUrl(
																	'//wordpress.com/website-design-service/'
																) }
																type="dropdown"
																target="_self"
															/>
														) }
														<ClickableItem
															titleValue=""
															content={ __( 'Commerce', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/ecommerce/' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'WordPress Studio', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//developer.wordpress.com/studio/' ) }
															type="dropdown"
															target="_self"
														/>
													</ul>
													<div className="x-dropdown-content-separator"></div>
													<ul>
														<ClickableItem
															titleValue=""
															content={ __( 'Enterprise WordPress', __i18n_text_domain__ ) }
															urlValue="https://wpvip.com/?utm_source=WordPresscom&utm_medium=automattic_referral&utm_campaign=top_nav"
															type="dropdown"
														/>
													</ul>
												</div>
											</li>
											<li className="x-nav-item x-nav-item__wide" role="none">
												<NonClickableItem
													className="x-nav-link x-link"
													content={ __( 'Features', __i18n_text_domain__ ) }
												/>
												<div
													className="x-dropdown-content"
													data-dropdown-name="features"
													role="menu"
													aria-label={ __( 'Features', __i18n_text_domain__ ) }
													aria-hidden="true"
												>
													<ul>
														<ClickableItem
															titleValue=""
															content={ __( 'Overview', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/features/' ) }
															type="dropdown"
															target="_self"
														/>
													</ul>
													<div className="x-dropdown-content-separator"></div>
													<ul>
														<ClickableItem
															titleValue=""
															content={ __( 'WordPress Themes', __i18n_text_domain__ ) }
															urlValue={ localizeUrl(
																'//wordpress.com/themes',
																locale,
																isLoggedIn,
																true
															) }
															type="dropdown"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'WordPress Plugins', __i18n_text_domain__ ) }
															urlValue={ localizeUrl(
																'//wordpress.com/plugins',
																locale,
																isLoggedIn,
																true
															) }
															type="dropdown"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'WordPress Patterns', __i18n_text_domain__ ) }
															urlValue={ localizeUrl(
																'//wordpress.com/patterns',
																locale,
																isLoggedIn,
																true
															) }
															type="dropdown"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Google Apps', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/google/' ) }
															type="dropdown"
															target="_self"
														/>
													</ul>
												</div>
											</li>
											<li className="x-nav-item x-nav-item__wide" role="none">
												<NonClickableItem
													className="x-nav-link x-link"
													content={ __( 'Resources', __i18n_text_domain__ ) }
												/>
												<div
													className="x-dropdown-content"
													data-dropdown-name="resources"
													role="menu"
													aria-label={ __( 'Resources', __i18n_text_domain__ ) }
													aria-hidden="true"
												>
													<ul>
														<ClickableItem
															titleValue=""
															content={ __( 'WordPress.com Support', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/support/' ) }
															type="dropdown"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'WordPress News', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/blog/' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Website Building Tips', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/go/' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Business Name Generator', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/business-name-generator/' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Logo Maker', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/logo-maker/' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Discover New Posts', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/discover' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Popular Tags', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/tags' ) }
															type="dropdown"
															target="_self"
														/>
														<ClickableItem
															titleValue=""
															content={ __( 'Blog Search', __i18n_text_domain__ ) }
															urlValue={ localizeUrl( '//wordpress.com/reader/search' ) }
															type="dropdown"
															target="_self"
														/>
													</ul>
												</div>
											</li>
											<ClickableItem
												className="x-nav-item x-nav-item__wide"
												titleValue=""
												content={ __( 'Plans & Pricing', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/pricing/' ) }
												type="nav"
												target="_self"
											/>
										</>
									) : null }
								</ul>
								<ul className="x-nav-list x-nav-list__right" role="menu">
									{ ! isLoggedIn && (
										<ClickableItem
											className="x-nav-item x-nav-item__wide"
											titleValue=""
											content={ __( 'Log In', __i18n_text_domain__ ) }
											urlValue={
												loginUrl ||
												localizeUrl( '//wordpress.com/log-in', locale, isLoggedIn, true )
											}
											type="nav"
										/>
									) }
									{ ! hideGetStartedCta && (
										<ClickableItem
											className="x-nav-item x-nav-item__wide"
											titleValue=""
											content={ __( 'Get Started', __i18n_text_domain__ ) }
											urlValue={ startUrl }
											type="nav"
											typeClassName="x-nav-link x-nav-link__primary x-link cta-btn-nav"
										/>
									) }
									<li className="x-nav-item x-nav-item__narrow" role="none">
										<button
											role="menuitem"
											className="x-nav-link x-nav-link__menu x-link"
											aria-haspopup="true"
											aria-expanded={ isMobileMenuOpen }
											onClick={ () => setMobileMenuOpen( true ) }
										>
											<span className="x-hidden">{ __( 'Menu', __i18n_text_domain__ ) }</span>
											<span className="x-icon x-icon__menu">
												<span></span>
												<span></span>
												<span></span>
											</span>
										</button>
									</li>
								</ul>
							</nav>
						</div>
					</div>
					{ /*<!-- Nav bar ends here. -->*/ }

					{ /*<!-- Mobile menu starts here. -->*/ }
					<div
						className={ isMobileMenuOpen ? 'x-menu x-menu__active x-menu__open' : 'x-menu' }
						role="menu"
						aria-label={ __( 'WordPress.com Navigation Menu', __i18n_text_domain__ ) }
						aria-hidden={ ! isMobileMenuOpen }
					>
						{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
						<div
							className="x-menu-overlay"
							onKeyDown={ () => setMobileMenuOpen( false ) }
							onClick={ () => setMobileMenuOpen( false ) }
						/>
						<div className="x-menu-content">
							<button className="x-menu-button x-link" onClick={ () => setMobileMenuOpen( false ) }>
								<span className="x-hidden">
									{ __( 'Close the navigation menu', __i18n_text_domain__ ) }
								</span>
								<span className="x-icon x-icon__close">
									<span></span>
									<span></span>
								</span>
							</button>
							<div className="x-menu-list" aria-hidden={ ! isMobileMenuOpen }>
								<div className="x-menu-list-title">
									{ __( 'Get Started', __i18n_text_domain__ ) }
								</div>
								{ ! isLoggedIn && (
									<ul className="x-menu-grid">
										<ClickableItem
											titleValue=""
											content={
												<>
													{ __( 'Sign Up', __i18n_text_domain__ ) }{ ' ' }
													<span className="x-menu-link-chevron" />
												</>
											}
											urlValue={ startUrl }
											type="menu"
											tabIndex={ mobileMenuTabIndex }
										/>
										<ClickableItem
											titleValue=""
											content={
												<>
													{ __( 'Log In', __i18n_text_domain__ ) }{ ' ' }
													<span className="x-menu-link-chevron" />
												</>
											}
											urlValue={ localizeUrl( '//wordpress.com/log-in', locale, isLoggedIn, true ) }
											type="menu"
											tabIndex={ mobileMenuTabIndex }
										/>
									</ul>
								) }
							</div>
							{ variant !== 'minimal' ? (
								<>
									<div className="x-menu-list" aria-hidden={ ! isMobileMenuOpen }>
										<div className="x-hidden">{ __( 'About', __i18n_text_domain__ ) }</div>
										<ul className="x-menu-grid">
											<ClickableItem
												titleValue=""
												content={ __( 'Plans & Pricing', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/pricing/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
										</ul>
									</div>
									<div className="x-menu-list" aria-hidden={ ! isMobileMenuOpen }>
										<div className="x-menu-list-title">
											{ __( 'Products', __i18n_text_domain__ ) }
										</div>
										<ul className="x-menu-grid">
											<ClickableItem
												titleValue=""
												content={ __( 'WordPress Hosting', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/hosting/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'WordPress for Agencies', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/for-agencies/' ) }
												type="dropdown"
												target="_self"
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Become an Affiliate', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/affiliates/' ) }
												type="dropdown"
												target="_self"
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Domain Names', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/domains/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'AI Website Builder', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/ai-website-builder/?ref=topnav' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Website Builder', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/website-builder/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Create a Blog', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/create-blog/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Newsletter', __i18n_text_domain__ ) }
												urlValue={ localizeUrl(
													'//wordpress.com/newsletter/',
													locale,
													isLoggedIn,
													true
												) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Professional Email', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/professional-email/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											{ isEnglishLocale && (
												<ClickableItem
													titleValue=""
													content={ __( 'Website Design Services', __i18n_text_domain__ ) }
													urlValue={ localizeUrl( '//wordpress.com/website-design-service/' ) }
													type="menu"
													target="_self"
													tabIndex={ mobileMenuTabIndex }
												/>
											) }
											<ClickableItem
												titleValue=""
												content={ __( 'Commerce', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/ecommerce/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'WordPress Studio', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//developer.wordpress.com/studio/' ) }
												type="dropdown"
												target="_self"
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Enterprise', __i18n_text_domain__ ) }
												urlValue="https://wpvip.com/?utm_source=WordPresscom&utm_medium=automattic_referral&utm_campaign=top_nav"
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
										</ul>
									</div>
									<div className="x-menu-list" aria-hidden={ ! isMobileMenuOpen }>
										<div className="x-menu-list-title">
											{ __( 'Features', __i18n_text_domain__ ) }
										</div>
										<ul className="x-menu-grid">
											<ClickableItem
												titleValue=""
												content={ __( 'Overview', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/features/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'WordPress Themes', __i18n_text_domain__ ) }
												urlValue={ localizeUrl(
													'//wordpress.com/themes',
													locale,
													isLoggedIn,
													true
												) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'WordPress Plugins', __i18n_text_domain__ ) }
												urlValue={ localizeUrl(
													'//wordpress.com/plugins',
													locale,
													isLoggedIn,
													true
												) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'WordPress Patterns', __i18n_text_domain__ ) }
												urlValue={ localizeUrl(
													'//wordpress.com/patterns',
													locale,
													isLoggedIn,
													true
												) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Google Apps', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/google/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
										</ul>
									</div>
									<div className="x-menu-list" aria-hidden={ ! isMobileMenuOpen }>
										<div className="x-menu-list-title">
											{ __( 'Resources', __i18n_text_domain__ ) }
										</div>
										<ul className="x-menu-grid">
											<ClickableItem
												titleValue=""
												content={ __( 'WordPress.com Support', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/support/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'News', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/blog/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Website Building Tips', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/go/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Business Name Generator', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/business-name-generator/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Logo Maker', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/logo-maker/' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Discover New Posts', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/discover' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Popular Tags', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/tags' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
											<ClickableItem
												titleValue=""
												content={ __( 'Blog Search', __i18n_text_domain__ ) }
												urlValue={ localizeUrl( '//wordpress.com/reader/search' ) }
												type="menu"
												tabIndex={ mobileMenuTabIndex }
											/>
										</ul>
									</div>
								</>
							) : null }
						</div>
					</div>
					{ /*<!-- Mobile menu ends here. -->*/ }
				</div>
			</div>
		</div>
	);
};

export default UniversalNavbarHeader;
