import {
	isValidPostalCode,
	isValidCPF,
	isValidCNPJ,
	countrySpecificFieldRules,
} from '@automattic/wpcom-checkout';
import creditcards from 'creditcards';
import i18n from 'i18n-calypso';
import { capitalize, compact, isEmpty, mergeWith } from 'lodash';

/**
 * Returns the credit card validation rule set
 * @returns {Object} the ruleset
 */
export function getCreditCardFieldRules() {
	return {
		name: {
			description: i18n.translate( 'Cardholder Name', {
				comment: 'Cardholder name label on credit card form',
			} ),
			rules: [ 'required' ],
		},

		number: {
			description: i18n.translate( 'Card Number', {
				comment: 'Card number label on credit card form',
			} ),
			rules: [ 'validCreditCardNumber' ],
		},

		'expiration-date': {
			description: i18n.translate( 'Credit Card Expiration Date' ),
			rules: [ 'validExpirationDate' ],
		},

		cvv: {
			description: i18n.translate( 'Credit Card CVV Code' ),
			rules: [ 'validCvvNumber' ],
		},

		country: {
			description: i18n.translate( 'Country' ),
			rules: [ 'required' ],
		},

		'postal-code': {
			description: i18n.translate( 'Postal Code', {
				comment: 'Postal code on credit card form',
			} ),
			rules: [ 'required' ],
		},
	};
}

/**
 * Returns the credit card validation rule set for stripe elements
 * @returns {Object} the ruleset
 */
export function getStripeElementsRules() {
	return {
		name: {
			description: i18n.translate( 'Cardholder Name', {
				comment: 'Cardholder name label on credit card form',
			} ),
			rules: [ 'required' ],
		},

		country: {
			description: i18n.translate( 'Country' ),
			rules: [ 'required' ],
		},

		'postal-code': {
			description: i18n.translate( 'Postal Code', {
				comment: 'Postal code on credit card form',
			} ),
			rules: [ 'required' ],
		},
	};
}

/**
 * Returns the token validation rule set
 * @returns {Object} the ruleset
 */
export function tokenFieldRules() {
	return {
		name: {
			description: i18n.translate( 'Cardholder Name', {
				comment: 'Cardholder name label on credit card form',
			} ),
			rules: [ 'required' ],
		},

		tokenized_payment_data: {
			description: i18n.translate( 'Tokenized Payment Data', {
				comment: 'Tokenized payment data from the token provider',
			} ),
			rules: [ 'required' ],
		},
	};
}

/**
 * Returns a validation ruleset to use for the given payment type
 * @param {Object} paymentDetails object containing fieldname/value keypairs
 * @param {string} paymentType credit-card|paypal|p24|netbanking|token|stripe|ebanx
 * @returns {Object | null} the ruleset
 */
export function paymentFieldRules( paymentDetails, paymentType ) {
	switch ( paymentType ) {
		case 'ebanx':
			return mergeValidationRules(
				getCreditCardFieldRules(),
				getConditionalCreditCardRules( paymentDetails ),
				getEbanxCreditCardRules( paymentDetails )
			);
		case 'credit-card':
			return mergeValidationRules(
				getCreditCardFieldRules(),
				getConditionalCreditCardRules( paymentDetails )
			);
		case 'netbanking':
			return countrySpecificFieldRules( 'IN' );
		case 'token':
			return tokenFieldRules();
		case 'stripe':
			return getStripeElementsRules();
		default:
			return null;
	}
}

/**
 * Returns arguments deep-merged into one object with any array values
 * concatentated and deduped
 * @param {Object} rulesets Objects describing the rulesets to be combined
 * @returns {Object} The aggregated ruleset
 */
export function mergeValidationRules( ...rulesets ) {
	return mergeWith( {}, ...rulesets, ( objValue, srcValue ) =>
		Array.isArray( objValue ) && Array.isArray( srcValue )
			? [ ...new Set( [].concat( objValue, srcValue ) ) ]
			: undefined
	);
}

function parseExpiration( value ) {
	const [ month, year ] = value.split( '/' );
	return {
		month: creditcards.expiration.month.parse( month ),
		year: creditcards.expiration.year.parse( year, true ),
	};
}

function validationError( description ) {
	return i18n.translate( '%(description)s is invalid', {
		args: { description: capitalize( description ) },
	} );
}

const validators = {};

validators.required = {
	isValid( value ) {
		return ! isEmpty( value );
	},

	error: function ( description ) {
		return i18n.translate( 'Missing required %(description)s field', {
			args: { description: description },
		} );
	},
};

validators.validCreditCardNumber = {
	isValid( value ) {
		if ( ! value ) {
			return false;
		}
		return creditcards.card.isValid( value );
	},
	error: validationError,
};

validators.validCvvNumber = {
	isValid( value ) {
		if ( ! value ) {
			return false;
		}
		return creditcards.cvc.isValid( value );
	},
	error: validationError,
};

validators.validExpirationDate = {
	isValid: function ( value ) {
		if ( ! value ) {
			return false;
		}
		const expiration = parseExpiration( value );

		return (
			creditcards.expiration.month.isValid( expiration.month ) &&
			creditcards.expiration.year.isValid( expiration.year ) &&
			! creditcards.expiration.isPast( expiration.month, expiration.year )
		);
	},
	error: validationError,
};

validators.isBrazil = {
	isValid( value ) {
		return value === 'BR';
	},
	error: function () {
		return i18n.translate(
			'Country code is invalid. This payment method is only available in Brazil.'
		);
	},
};

validators.validBrazilTaxId = {
	isValid( value ) {
		if ( ! value ) {
			return false;
		}
		return isValidCPF( value ) || isValidCNPJ( value );
	},
	error: function ( description ) {
		return i18n.translate(
			'%(description)s is invalid. Must be in format: 111.444.777-XX or 11.444.777/0001-XX',
			{
				args: { description: description },
			}
		);
	},
};

validators.validIndiaPan = {
	isValid( value ) {
		const panRegex = /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/;

		if ( ! value ) {
			return false;
		}
		return panRegex.test( value );
	},
	error: function ( description ) {
		return i18n.translate( '%(description)s is invalid', {
			args: { description },
		} );
	},
};

validators.validIndonesiaNik = {
	isValid( value ) {
		const digitsOnly = typeof value === 'string' ? value.replace( /[^0-9]/g, '' ) : '';
		return digitsOnly.length === 16;
	},
	error: function ( description ) {
		return i18n.translate( '%(description)s is invalid', {
			args: { description: capitalize( description ) },
		} );
	},
};

validators.validIndiaGstin = {
	isValid( value ) {
		const gstinRegex =
			/^([0-2][0-9]|[3][0-7])[A-Z]{3}[ABCFGHLJPTK][A-Z]\d{4}[A-Z][A-Z0-9][Z][A-Z0-9]$/i;

		if ( ! value ) {
			return true;
		}
		return gstinRegex.test( value );
	},
	error: function ( description ) {
		return i18n.translate( '%(description)s is invalid', {
			args: { description },
		} );
	},
};

validators.validPostalCodeUS = {
	isValid: ( value ) => isValidPostalCode( value, 'US' ),
	error: function ( description ) {
		return i18n.translate( '%(description)s is invalid. Must be a 5 digit number', {
			args: { description: description },
		} );
	},
};

validators.validStreetNumber = {
	isValid( streetNumber ) {
		return streetNumber !== '0';
	},
	error: validationError,
};

/**
 * Runs payment fields through the relevant validation rules
 *
 * Use these validation rules, for example, in <CreditCardForm />,
 * <PayPalPaymentBox /> and <RedirectPaymentBox />
 *
 * Returns an object with one property: `errors`. That object is another object
 * with keys that are the field names of those errors.  The value of each
 * property of that object is an array of error strings.
 * @param {Object.<string, string>} paymentDetails object containing fieldname/value keypairs
 * @param {string} paymentType credit-card|paypal|p24|netbanking|token|stripe|ebanx
 * @returns {{errors:Object.<string, string[]>}} validation errors, if any
 */
export function validatePaymentDetails( paymentDetails, paymentType ) {
	const rules = paymentFieldRules( paymentDetails, paymentType ) || {};
	const errors = Object.keys( rules ).reduce( function ( allErrors, fieldName ) {
		const field = rules[ fieldName ];
		const newErrors = getErrors( field, paymentDetails[ fieldName ], paymentDetails );

		if ( newErrors.length ) {
			allErrors[ fieldName ] = newErrors;
		}

		return allErrors;
	}, {} );
	return { errors };
}

/**
 * Retrieves the type of credit card from the specified number.
 * @param {string} number - credit card number
 * @returns {string|null} the type of the credit card
 * @see {@link http://en.wikipedia.org/wiki/Bank_card_number} for more information
 */
export function getCreditCardType( number ) {
	if ( number ) {
		number = number.replace( / /g, '' );

		let cardType = creditcards.card.type( number, true );

		if ( typeof cardType === 'undefined' ) {
			return null;
		}

		// We already use 'amex' for American Express everywhere else
		if ( cardType === 'American Express' ) {
			cardType = 'amex';
		}

		// Normalize Diners as well
		if ( cardType === 'Diners Club' ) {
			cardType = 'diners';
		}

		return cardType.toLowerCase();
	}

	return null;
}

/**
 *
 * @param {string} field the name of the field
 * @param {*} value the value of the field
 * @param {Object} paymentDetails object containing fieldname/value keypairs
 * @returns {Array} array of errors found, if any
 */
function getErrors( field, value, paymentDetails ) {
	return compact(
		field.rules.map( function ( rule ) {
			const validator = getValidator( rule );

			if ( ! validator.isValid( value, paymentDetails ) ) {
				return validator.error( field.description );
			}
		} )
	);
}

function getEbanxCreditCardRules( { country } ) {
	return country && countrySpecificFieldRules( country );
}

/**
 *
 * @param {{country: string}} cardDetails - a map of credit card field key value pairs
 * @returns {Object | null} If match is found,
 * an object containing rule sets for specific credit card processing providers,
 * otherwise `null`
 */
function getConditionalCreditCardRules( { country } ) {
	switch ( country ) {
		case 'US':
			return {
				'postal-code': {
					description: i18n.translate( 'Postal Code', {
						comment: 'Postal code on credit card form',
					} ),
					rules: [ 'required', 'validPostalCodeUS' ],
				},
			};
	}

	return null;
}

function getValidator( rule ) {
	if ( Array.isArray( rule ) ) {
		return validators[ rule[ 0 ] ].apply( null, rule.slice( 1 ) );
	}

	return validators[ rule ];
}
