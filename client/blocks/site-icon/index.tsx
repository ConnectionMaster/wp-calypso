import { Gridicon, Spinner } from '@automattic/components';
import clsx from 'clsx';
import { get } from 'lodash';
import { InView } from 'react-intersection-observer';
import { connect } from 'react-redux';
import QuerySites from 'calypso/components/data/query-sites';
import Image from 'calypso/components/image';
import resizeImageUrl from 'calypso/lib/resize-image-url';
import MediaImage from 'calypso/my-sites/media-library/media-image';
import getSiteIconId from 'calypso/state/selectors/get-site-icon-id';
import getSiteIconUrl from 'calypso/state/selectors/get-site-icon-url';
import isTransientMedia from 'calypso/state/selectors/is-transient-media';
import { getSite } from 'calypso/state/sites/selectors';

import './style.scss';

export type Site = {
	ID?: number;
	icon?: {
		img: string;
	};
};

export type SiteIconVariant = 'primary' | 'blank';

type SiteIconProps = {
	siteId?: number;
	site?: object;
	iconUrl?: string | null;
	size?: number;
	imgSize?: number;
	isTransientIcon?: boolean;
	defaultIcon?: JSX.Element | null;
	alt?: string;
	href?: string;
	title?: string;
	lazy?: boolean;
	variant?: SiteIconVariant;
	onClick?: () => void;
};

export function SiteIcon( {
	siteId,
	site,
	iconUrl,
	size = 32,
	imgSize = 120,
	isTransientIcon,
	defaultIcon = null,
	alt = '',
	href = '',
	title = '',
	lazy = false,
	variant = 'blank',
	onClick = () => {},
}: SiteIconProps ) {
	iconUrl = iconUrl?.replace( /\/$/, '' ); // Remove trailing slash from URL as it may lead to 404 errors when adding size parameters.
	const iconSrc = resizeImageUrl( iconUrl, imgSize, null );

	const classes = clsx( 'site-icon', {
		[ `is-${ variant }` ]: ! iconSrc,
		'is-transient': isTransientIcon,
	} );

	const style = {
		height: size,
		width: size,
		lineHeight: size + 'px',
		fontSize: size + 'px',
	};

	const icon = defaultIcon || <Gridicon icon="globe" size={ Math.round( size / 1.8 ) } />;

	const children = (
		<>
			{ iconSrc ? (
				<MediaImage component={ Image } className="site-icon__img" src={ iconSrc } alt={ alt } />
			) : (
				icon
			) }
			{ isTransientIcon && <Spinner /> }
		</>
	);

	// The component need to request the site data if it's not available in the Redux state.
	// To avoid excessive network requests, render the <QuerySites /> component only when it enters the viewport.
	return (
		<InView triggerOnce fallbackInView skip={ ! lazy }>
			{ ( { inView, ref } ) => (
				<div className={ classes } style={ style } ref={ ref }>
					{ ( ! lazy || inView ) && ! site && typeof siteId === 'number' && siteId > 0 && (
						<QuerySites siteId={ siteId } />
					) }
					{ href ? (
						<a href={ href } title={ title } onClick={ onClick }>
							{ children }
						</a>
					) : (
						children
					) }
				</div>
			) }
		</InView>
	);
}

type SiteIconContainerProps = {
	siteId?: number;
	site?: Site;
	imgSize?: number;
};

export default connect( ( state, { site, siteId }: SiteIconContainerProps ) => {
	// Always prefer site from Redux state if available
	const stateSite = getSite( state as object, get( site, 'ID', siteId ) );

	// Until all sites state is within Redux, we provide compatibility in cases
	// where sites-list object is passed to use the icon.img property as URL.
	// Specifically this shows icon for non-selected <SiteSelector /> sites,
	// since only the selected site is currently received into state.
	if ( ! stateSite ) {
		return {
			iconUrl: site?.icon?.img,
		};
	}

	const iconId = getSiteIconId( state as object, stateSite.ID );

	return {
		site: stateSite,
		iconUrl: getSiteIconUrl( state as object, stateSite.ID ),
		isTransientIcon: isTransientMedia( state, stateSite.ID, iconId ),
	};
} )( SiteIcon );
