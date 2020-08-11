/**
 * External dependencies
 */
import { translate, TranslateResult } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { PRODUCTS_WITH_OPTIONS, OPTIONS_SLUG_MAP } from './constants';
import {
	TERM_ANNUALLY,
	TERM_MONTHLY,
	TERM_BIENNIALLY,
	JETPACK_LEGACY_PLANS,
	JETPACK_RESET_PLANS,
} from 'lib/plans/constants';
import { getPlan, getMonthlyPlanByYearly } from 'lib/plans';
import { JETPACK_PRODUCT_PRICE_MATRIX } from 'lib/products-values/constants';
import { Product, JETPACK_PRODUCTS_LIST, objectIsProduct } from 'lib/products-values/products-list';
import { getJetpackProductDisplayName } from 'lib/products-values/get-jetpack-product-display-name';
import { getJetpackProductTagline } from 'lib/products-values/get-jetpack-product-tagline';
import { getJetpackProductDescription } from 'lib/products-values/get-jetpack-product-description';
import { getJetpackProductShortName } from 'lib/products-values/get-jetpack-product-short-name';

/**
 * Type dependencies
 */
import type {
	Duration,
	SelectorProduct,
	SelectorProductSlug,
	AvailableProductData,
	SelectorProductCost,
} from './types';
import type { JetpackPlanSlugs, Plan } from 'lib/plans/types';
import type { JetpackProductSlug } from 'lib/products-values/types';

export function stringToDuration( duration?: string ): Duration | undefined {
	if ( duration === undefined ) {
		return undefined;
	}
	if ( duration === 'monthly' ) {
		return TERM_MONTHLY;
	}
	return TERM_ANNUALLY;
}

export function durationToText( duration: Duration ): TranslateResult {
	return duration === TERM_MONTHLY
		? translate( 'per month, billed monthly' )
		: translate( 'per year' );
}

export function productButtonLabel( product: SelectorProduct ): TranslateResult {
	return (
		product.buttonLabel ??
		translate( 'Get %s', {
			args: product.displayName,
			context: '%s is the name of a product',
		} )
	);
}

export function getProductPrices(
	product: SelectorProduct,
	availableProducts: Record< string, AvailableProductData >
): SelectorProductCost {
	const availableProduct = availableProducts[ product.costProductSlug || product.productSlug ];
	// Return if not annual price.
	if ( product.term !== TERM_ANNUALLY || ! availableProduct || ! product.monthlyProductSlug ) {
		return {
			cost: get( availableProduct, 'cost', 0 ),
		};
	}

	const relatedAvailableProduct = availableProducts[ product.monthlyProductSlug ];
	return {
		discountCost: get( availableProduct, 'cost', 0 ),
		cost: get( relatedAvailableProduct, 'cost', 0 ) * 12,
	};
}

function slugIsSelectorProductSlug( slug: string ): slug is SelectorProductSlug {
	return PRODUCTS_WITH_OPTIONS.includes( slug as typeof PRODUCTS_WITH_OPTIONS[ number ] );
}
function slugIsJetpackProductSlug( slug: string ): slug is JetpackProductSlug {
	return slug in JETPACK_PRODUCTS_LIST;
}
function slugIsJetpackPlanSlug( slug: string ): slug is JetpackPlanSlugs {
	return [ ...JETPACK_LEGACY_PLANS, ...JETPACK_RESET_PLANS ].includes( slug );
}

export function slugToItem( slug: string ): Plan | Product | SelectorProduct | null {
	if ( slugIsSelectorProductSlug( slug ) ) {
		return OPTIONS_SLUG_MAP[ slug ];
	} else if ( slugIsJetpackProductSlug( slug ) ) {
		return JETPACK_PRODUCTS_LIST[ slug ];
	} else if ( slugIsJetpackPlanSlug( slug ) ) {
		return getPlan( slug ) as Plan;
	}
	return null;
}

function objectIsSelectorProduct( item: object ): item is SelectorProduct {
	const requiredKeys = [
		'productSlug',
		'iconSlug',
		'displayName',
		'tagline',
		'description',
		'term',
	];
	return requiredKeys.every( ( k ) => k in item );
}
function objectIsPlan( item: object ): item is Plan {
	const requiredKeys = [
		'group',
		'type',
		'term',
		'getBillingTimeFrame',
		'getTitle',
		'getDescription',
		'getProductId',
		'getStoreSlug',
	];
	return requiredKeys.every( ( k ) => k in item );
}

/**
 * Converts data from a product, plan, or selector product to selector product.
 *
 * @param item Product, Plan, or SelectorProduct.
 * @returns SelectorProduct
 */
export function itemToSelectorProduct(
	item: Plan | Product | SelectorProduct | object
): SelectorProduct | null {
	if ( objectIsSelectorProduct( item ) ) {
		return item;
	} else if ( objectIsProduct( item ) ) {
		let monthlyProductSlug = undefined;
		if (
			item.term === TERM_ANNUALLY &&
			Object.keys( JETPACK_PRODUCT_PRICE_MATRIX ).includes( item.product_slug )
		) {
			monthlyProductSlug =
				JETPACK_PRODUCT_PRICE_MATRIX[
					item.product_slug as keyof typeof JETPACK_PRODUCT_PRICE_MATRIX
				].relatedProduct;
		}
		return {
			productSlug: item.product_slug,
			iconSlug: `${ item.product_slug }_v2`,
			displayName: getJetpackProductDisplayName( item ),
			tagline: getJetpackProductTagline( item ),
			description: getJetpackProductDescription( item ),
			monthlyProductSlug,
			buttonLabel: translate( 'Get %s', {
				args: getJetpackProductShortName( item ),
				context: '%s is the name of a product',
			} ),
			term: item.term,
			features: [],
		};
	} else if ( objectIsPlan( item ) ) {
		const productSlug = item.getStoreSlug();
		let monthlyProductSlug = undefined;
		if ( item.term === TERM_ANNUALLY ) {
			monthlyProductSlug = getMonthlyPlanByYearly( productSlug );
		}
		return {
			productSlug,
			iconSlug: productSlug,
			displayName: item.getTitle(),
			tagline: get( item, 'getTagline', () => '' )(),
			description: item.getDescription(),
			monthlyProductSlug,
			term: item.term === TERM_BIENNIALLY ? TERM_ANNUALLY : item.term,
			features: [],
		};
	}
	return null;
}
