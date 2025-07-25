import { get } from 'lodash';
import getCurrentQueryArguments from 'calypso/state/selectors/get-current-query-arguments';
import getInitialQueryArguments from 'calypso/state/selectors/get-initial-query-arguments';
import { isWooDnaFlow } from './is-woo-dna-flow';
import { isWooCommerceCoreProfilerFlow } from './is-woocommerce-core-profiler-flow';
import type { AppState } from 'calypso/types';

// The legacy Jetpack Woo Onboarding flow is not in use anymore,
// and is now absorbed into the Woo JPC Onboarding flow.
// See https://github.com/Automattic/wp-calypso/pull/99558 for more details.
const isLegacyJetpackWooOnboardingFlow = ( state: AppState ) => {
	return 'woocommerce-onboarding' === get( getCurrentQueryArguments( state ), 'from' );
};

export const isWooCommercePaymentsOnboardingFlow = ( state: AppState ) => {
	const from =
		get( getInitialQueryArguments( state ), 'from' ) === 'woocommerce-payments' ||
		get( getCurrentQueryArguments( state ), 'from' ) === 'woocommerce-payments' ||
		get( getInitialQueryArguments( state ), 'from' ) === 'woocommerce-onboarding' ||
		get( getCurrentQueryArguments( state ), 'from' ) === 'woocommerce-onboarding';

	const redirectTo =
		get( getInitialQueryArguments( state ), 'redirect_to' ) ||
		get( getCurrentQueryArguments( state ), 'redirect_to' );

	// Unlike WooCommerce Core Profiler flow, we use both `from` and `plugin_name` to determine if the user is in the Woo Payments onboarding flow.
	// `plugin_name` might not present in the query arguments, so we need to check the `redirect_to` query argument as well.
	const redirectToHasWooCommercePayments =
		typeof redirectTo === 'string' &&
		( () => {
			try {
				return new URLSearchParams( redirectTo ).get( 'plugin_name' ) === 'woocommerce-payments';
			} catch {
				return false;
			}
		} )();

	const plugin =
		get( getInitialQueryArguments( state ), 'plugin_name' ) === 'woocommerce-payments' ||
		get( getCurrentQueryArguments( state ), 'plugin_name' ) === 'woocommerce-payments' ||
		redirectToHasWooCommercePayments;

	return from && plugin;
};

/**
 * Returns true if the user should see the new passwordless Jetpack connection flow.
 * Users should see this flow if they are:
 *
 * - Reached the page via the WooCommerce Core Profiler flow.
 * - Reached the page via the Woo Payments onboarding flow.
 * @param  {Object}   state  Global state tree
 * @returns {?boolean}        Whether the user should see the new passwordless Jetpack connection or not
 */
export const isWooJPCFlow = ( state: AppState ): boolean => {
	return (
		isLegacyJetpackWooOnboardingFlow( state ) ||
		isWooCommerceCoreProfilerFlow( state ) ||
		isWooCommercePaymentsOnboardingFlow( state ) ||
		isWooDnaFlow( state )
	);
};

export default isWooJPCFlow;
