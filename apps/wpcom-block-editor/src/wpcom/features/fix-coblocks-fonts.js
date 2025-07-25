import domReady from '@wordpress/dom-ready';
import { removeFilter } from '@wordpress/hooks';
import { isEditorReadyWithBlocks } from '../../utils';

/**
 * Remove the CoBlocks font styles filter from the block save content.
 *
 * The CoBlocks font styles filter is causing invalid blocks to be saved.
 * Specifically, the filter is adding a style attribute to the block save
 * content which includes a rule for the font-family. As wpcom doesn't use
 * the CoBlocks typography controls, we can safely remove the filter.
 *
 * Note that this doesn't work in versions of co-blocks released from 2022
 * onwards - all of the filters across CoBlocks were reconciled into one
 * so we can't remove the filter for just the font styles.
 * @see https://github.com/godaddy-wordpress/coblocks/issues/2475
 */
function removeCoBlocksFontStyles() {
	removeFilter( 'blocks.getSaveContent.extraProps', 'coblocks/applyFontSettings' );
}

domReady( () => {
	// Remove the filter immediately when the dom is ready.
	removeCoBlocksFontStyles();

	// For backward compatibility, this ensures that the filter can be removed
	// even if it was registered between the DOM ready and editor ready events.
	isEditorReadyWithBlocks().then( () => {
		removeCoBlocksFontStyles();
	} );
} );
