import { By } from 'selenium-webdriver';

import * as driverHelper from '../../driver-helper';

import GutenbergBlockComponent from './gutenberg-block-component';

class ContactFormBlockComponent extends GutenbergBlockComponent {
	static blockTitle = 'Form';
	static blockName = 'jetpack/contact-form';
	static blockFrontendLocator = By.css( '.entry-content .wp-block-jetpack-contact-form' );

	async _postInit() {
		return await driverHelper.clickWhenClickable(
			this.driver,
			By.css( '.components-button.block-editor-block-variation-picker__variation' )
		);
	}

	async openEditSettings() {
		const editLocator = By.css( '.jetpack-contact-form-settings-selector' );
		return await driverHelper.clickWhenClickable( this.driver, editLocator );
	}

	async insertEmail( email ) {
		const emailLocator = By.css(
			'.jetpack-contact-form__popover .components-base-control:nth-of-type(1) .components-text-control__input'
		);
		await driverHelper.waitUntilElementLocatedAndVisible( this.driver, emailLocator );

		const emailTextfield = await this.driver.findElement( emailLocator );
		return await emailTextfield.sendKeys( email );
	}

	async insertSubject( subject ) {
		const subjectLocator = By.css(
			'.jetpack-contact-form__popover .components-base-control:nth-of-type(2) .components-text-control__input'
		);
		await driverHelper.waitUntilElementLocatedAndVisible( this.driver, subjectLocator );

		const subjectTextfield = await this.driver.findElement( subjectLocator );
		return await subjectTextfield.sendKeys( subject );
	}

	async submitForm() {
		return await driverHelper.clickWhenClickable(
			this.driver,
			By.css( '.jetpack-contact-form__create .components-button' )
		);
	}
}

export { ContactFormBlockComponent };
