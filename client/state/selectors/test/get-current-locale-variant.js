/** @format */

/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { getCurrentLocaleVariant } from 'state/selectors';

describe( 'getCurrentLocaleVariant()', () => {
	test( 'should return null as default', () => {
		const state = {
			ui: {
				language: {},
			},
		};

		expect( getCurrentLocaleVariant( state ) ).to.be.null;
	} );

	test( 'should return the locale variant slug stored', () => {
		const localeVariant = 'awesome_variant';
		const state = {
			ui: {
				language: {
					localeVariant,
				},
			},
		};

		expect( getCurrentLocaleVariant( state ) ).to.eql( localeVariant );
	} );
} );
