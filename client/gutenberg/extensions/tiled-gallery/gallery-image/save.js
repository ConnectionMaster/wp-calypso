/**
 * External Dependencies
 */
import { isBlobURL } from '@wordpress/blob';

/* @TODO Caption has been commented out */
// import { RichText } from '@wordpress/editor';

export default function GalleryImageSave( props ) {
	const {
		alt,
		// caption,
		height,
		id,
		link,
		linkTo,
		origUrl,
		url,
		width,
	} = props;

	if ( isBlobURL( origUrl ) ) {
		return null;
	}

	let href;

	switch ( linkTo ) {
		case 'media':
			href = url;
			break;
		case 'attachment':
			href = link;
			break;
	}

	const img = (
		<img
			alt={ alt }
			data-height={ height }
			data-id={ id }
			data-link={ link }
			data-url={ origUrl }
			data-width={ width }
			src={ url }
		/>
	);

	return (
		<figure className="tiled-gallery__item">
			{ href ? <a href={ href }>{ img }</a> : img }
			{ /* ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) */ }
		</figure>
	);
}
