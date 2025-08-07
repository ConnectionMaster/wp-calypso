import { getCurrentTab, getLocalizedRoutes, getPrivateRoutes } from '..';

describe( 'getLocalizedRoutes', () => {
	it( 'returns the routes with the locale prefix', () => {
		const testRoutes = [
			{ path: '/discover', requiresAuth: false },
			{ path: '/discover/recommended', requiresAuth: false },
			{
				path: '/discover/tags',
				requiresAuth: true,
			},
		];
		const routes = getLocalizedRoutes( 'en', testRoutes );

		expect( routes ).toEqual( [
			'/en/discover',
			'/discover',
			'/en/discover/recommended',
			'/discover/recommended',
			'/en/discover/tags',
			'/discover/tags',
		] );
	} );

	it( 'returns the private routes with the locale prefix', () => {
		const privateRoutes = [
			{ path: '/discover/public', requiresAuth: false },
			{
				path: '/discover/private',
				requiresAuth: true,
			},
		];

		const routes = getPrivateRoutes( 'en', privateRoutes );

		expect( routes ).toEqual( [ '/en/discover/private', '/discover/private' ] );
	} );
} );

describe( 'getCurrentTab', () => {
	it( 'returns the current tab', () => {
		expect( getCurrentTab( '/discover/firstposts' ) ).toEqual( 'firstposts' );
	} );

	it( 'ignores the locale', () => {
		expect( getCurrentTab( '/en/discover/firstposts' ) ).toEqual( 'firstposts' );
	} );

	it( 'ignores the query params', () => {
		expect( getCurrentTab( '/discover/firstposts?foo=bar' ) ).toEqual( 'firstposts' );
	} );

	it( 'returns the default tab when there is no tab', () => {
		expect( getCurrentTab( '/discover', 'my-default-tab' ) ).toEqual( 'my-default-tab' );
	} );
} );
