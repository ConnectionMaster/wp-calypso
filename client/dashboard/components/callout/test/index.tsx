/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { Callout } from '../index';

describe( 'Callout', () => {
	test( 'renders title and description', () => {
		render( <Callout title="Test Title" titleAs="h6" description={ <p>Helpful content</p> } /> );
		expect(
			screen.getByRole( 'heading', {
				name: 'Test Title',
			} )
		).toBeInTheDocument();
		expect( screen.getByRole( 'paragraph' ) ).toHaveTextContent( 'Helpful content' );
	} );

	test( 'renders img element using image', () => {
		render(
			<Callout
				title="Test Title"
				description={ <p>Helpful content</p> }
				image="https://example.com/illustration.png"
				imageAlt="Illustration"
			/>
		);
		expect( screen.getByRole( 'img', { name: 'Illustration' } ) ).toHaveAttribute(
			'src',
			'https://example.com/illustration.png'
		);
	} );
} );
