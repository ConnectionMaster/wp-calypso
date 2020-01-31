// Initialize polyfills before any dependencies are loaded
import './polyfills';

/**
 * Internal dependencies
 */
import { bootApp } from './common';

/**
 * Style dependencies
 */
import 'assets/stylesheets/style.scss';

window.AppBoot = () => {
	bootApp( 'Calypso' );
};
