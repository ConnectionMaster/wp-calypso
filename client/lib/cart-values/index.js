/**
 * External dependencies
 */
import url from 'url'; // eslint-disable-line no-restricted-imports
import update, { extend as extendImmutabilityHelper } from 'immutability-helper';
import { translate } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	hasRenewalItem,
	hasFreeTrial,
	hasProduct,
	hasDomainRegistration,
	hasPlan,
} from './cart-items';
import {
	isCredits,
	isDomainRedemption,
	allowedProductAttributes,
} from 'calypso/lib/products-values';

// Auto-vivification from https://github.com/kolodny/immutability-helper#autovivification
extendImmutabilityHelper( '$auto', function ( value, object ) {
	return object ? update( object, value ) : update( {}, value );
} );

/**
 * Preprocesses cart for server.
 *
 * @param {import('@automattic/shopping-cart').ResponseCart} cart Cart object.
 * @returns {import('@automattic/shopping-cart').RequestCart} A new cart object.
 */
export function preprocessCartForServer( {
	coupon,
	is_coupon_applied,
	is_coupon_removed,
	currency,
	temporary,
	extra,
	products,
	tax,
} ) {
	const needsUrlCoupon = ! (
		coupon ||
		is_coupon_applied ||
		is_coupon_removed ||
		typeof document === 'undefined'
	);
	const urlCoupon = needsUrlCoupon ? url.parse( document.URL, true ).query.coupon : '';

	return Object.assign(
		{
			coupon,
			is_coupon_applied,
			is_coupon_removed,
			currency,
			tax,
			temporary,
			extra,
			products: products.map(
				( { product_id, meta, free_trial, volume, quantity, extra: productExtra } ) => ( {
					product_id,
					meta,
					free_trial,
					volume,
					quantity,
					extra: productExtra,
				} )
			),
		},
		needsUrlCoupon &&
			urlCoupon && {
				coupon: urlCoupon,
				is_coupon_applied: false,
			}
	);
}

/**
 * Create a new empty cart.
 *
 * A cart has at least a `blog_id` and an empty list of `products`
 * We can give additional attributes and build new types of empty carts.
 * For instance you may want to create a temporary this way:
 * `emptyCart( 123456, { temporary: true } )`
 *
 * @param {number} [siteId] The Site Id the cart will be associated with
 * @param {object} [attributes] Additional attributes for the cart (optional)
 * @returns {object} [emptyCart] The new empty cart created
 */
export function emptyCart( siteId, attributes ) {
	return Object.assign( { blog_id: siteId, products: [] }, attributes );
}

export function applyCoupon( coupon ) {
	return function ( cart ) {
		return update( cart, {
			coupon: { $set: coupon },
			is_coupon_applied: { $set: false },
			$unset: [ 'is_coupon_removed' ],
		} );
	};
}

export function removeCoupon() {
	return function ( cart ) {
		return update( cart, {
			coupon: { $set: '' },
			is_coupon_applied: { $set: false },
			$merge: { is_coupon_removed: true },
		} );
	};
}

export const getTaxCountryCode = ( cart ) => cart?.tax?.location?.country_code;

export const getTaxPostalCode = ( cart ) => cart?.tax?.location?.postal_code;

export const getTaxLocation = ( cart ) => cart?.tax?.location ?? {};

export function setTaxCountryCode( countryCode ) {
	return function ( cart ) {
		return update( cart, {
			$auto: {
				tax: {
					$auto: {
						location: {
							$auto: {
								country_code: {
									$set: countryCode,
								},
							},
						},
					},
				},
			},
		} );
	};
}

export function setTaxPostalCode( postalCode ) {
	return function ( cart ) {
		return update( cart, {
			$auto: {
				tax: {
					$auto: {
						location: {
							$auto: {
								postal_code: {
									$set: postalCode,
								},
							},
						},
					},
				},
			},
		} );
	};
}

export function setTaxLocation( { postalCode, countryCode } ) {
	return function ( cart ) {
		return update( cart, {
			$auto: {
				tax: {
					$auto: {
						location: {
							$auto: {
								$set: { postal_code: postalCode, country_code: countryCode },
							},
						},
					},
				},
			},
		} );
	};
}

export function canRemoveFromCart( cart, cartItem ) {
	if ( isCredits( cartItem ) ) {
		return false;
	}

	if ( hasRenewalItem( cart ) && isDomainRedemption( cartItem ) ) {
		return false;
	}

	return true;
}

/**
 * Compare two different cart objects and get the messages of newest one
 *
 * It's possible that we're comparing two carts that have the same server header date.
 * This means the changes only happened locally and the messages returned will be empty.
 *
 * Supports both the cart object generated by the CartStore (which includes its
 * own timestamp) as well as the ResponseCart object returned by the
 * shopping-cart endpoint directly.
 *
 * @param {import('@automattic/shopping-cart').ResponseCart|null} previousCartValue - the previously loaded cart
 * @param {import('@automattic/shopping-cart').ResponseCart} nextCartValue - the new cart value
 * @returns {import('@automattic/shopping-cart').ResponseCartMessages} nextCartMessages - messages about the state of the cart
 */
export function getNewMessages( previousCartValue, nextCartValue ) {
	const nextCartMessages = nextCartValue.messages || [];
	const previousCartTimestamp =
		previousCartValue?.client_metadata?.last_server_response_date ||
		previousCartValue?.cart_generated_at_timestamp;
	const nextCartTimestamp =
		nextCartValue.client_metadata?.last_server_response_date ||
		nextCartValue.cart_generated_at_timestamp;

	// If there is no previous cart then just return the messages for the new cart
	if ( ! previousCartTimestamp || ! nextCartTimestamp ) {
		return nextCartMessages;
	}

	const hasNewServerData = new Date( nextCartTimestamp ) > new Date( previousCartTimestamp );

	return hasNewServerData ? nextCartMessages : {};
}

export function isPaidForFullyInCredits( cart ) {
	return (
		! hasFreeTrial( cart ) &&
		! hasProduct( cart, 'wordpress-com-credits' ) &&
		cart.total_cost <= cart.credits &&
		cart.total_cost > 0
	);
}

export function isFree( cart ) {
	return cart.total_cost === 0 && ! hasFreeTrial( cart );
}

export function fillInAllCartItemAttributes( cart, products ) {
	return update( cart, {
		products: {
			$apply: function ( items ) {
				return (
					items &&
					items.map( function ( cartItem ) {
						return fillInSingleCartItemAttributes( cartItem, products );
					} )
				);
			},
		},
	} );
}

export function fillInSingleCartItemAttributes( cartItem, products ) {
	const product = products[ cartItem.product_slug ];
	const attributes = allowedProductAttributes( product );

	return { ...cartItem, ...attributes };
}

/**
 * Return a string that represents the overall refund policy for all the items
 * in the shopping cart. See the support documentation for more details on
 * these policies:
 *
 * https://wordpress.com/support/refunds/
 *
 * @param {object} cart - cart as `CartValue` object
 * @returns {string} the refund policy type
 */
export function getRefundPolicy( cart ) {
	if ( hasDomainRegistration( cart ) && hasPlan( cart ) ) {
		return 'planWithDomainRefund';
	}

	if ( hasDomainRegistration( cart ) ) {
		return 'domainRefund';
	}

	return 'genericRefund';
}

/**
 * Return a string that represents the User facing name for payment method
 *
 * @param {string} method - payment method
 * @returns {string} the title
 */
export function paymentMethodName( method ) {
	const paymentMethodsNames = {
		alipay: 'Alipay',
		bancontact: 'Bancontact',
		card: translate( 'Credit or debit card' ),
		eps: 'EPS',
		giropay: 'Giropay',
		id_wallet: 'OVO',
		ideal: 'iDEAL',
		netbanking: 'Net Banking',
		paypal: 'PayPal',
		p24: 'Przelewy24',
		'brazil-tef': 'Transferência bancária',
		'apple-pay': 'Apple Pay',
		wechat: translate( 'WeChat Pay', {
			comment: 'Name for WeChat Pay - https://pay.weixin.qq.com/',
		} ),
		sofort: 'Sofort',
	};

	return paymentMethodsNames[ method ] || method;
}

export function getLocationOrigin( l ) {
	return l.protocol + '//' + l.hostname + ( l.port ? ':' + l.port : '' );
}

export function hasPendingPayment( cart ) {
	if ( cart && cart.has_pending_payment ) {
		return true;
	}

	return false;
}

export function shouldShowTax( cart ) {
	return cart?.tax?.display_taxes ?? false;
}
