import { __ } from '@wordpress/i18n';
import type { Context, Message, OdieAllowedBots } from './types';
declare const __i18n_text_domain__: string;

export const getOdieErrorMessage = (): string =>
	__(
		"Sorry, I'm offline right now. Leave our Support team a note and they'll get back to you as soon as possible.",
		__i18n_text_domain__
	);

export const getOdieErrorMessageNonEligible = (): string =>
	__(
		'Sorry, I am offline right now. Come back later or ask for help in our forums:',
		__i18n_text_domain__
	);

export const getOdieRateLimitMessageContent = (): string =>
	__(
		"Hi there! You've hit your AI usage limit. Upgrade your plan for unlimited Wapuu support! You can still get user support using the buttons below.",
		__i18n_text_domain__
	);

export const getOdieRateLimitMessage = (): Message => ( {
	content: getOdieRateLimitMessageContent(),
	role: 'bot',
	type: 'message',
} );

export const getOdieForwardToForumsMessage = (): string =>
	__(
		'It sounds like you want to talk to a human. Human support is only available for our [paid plans](https://wordpress.com/pricing/). For community support, visit our forums:',
		__i18n_text_domain__
	);

export const getOdieForwardToZendeskMessage = (): string =>
	__(
		'It sounds like you want to talk to a human. We’re here to help! Use the option below to message our Happiness Engineers.',
		__i18n_text_domain__
	);

export const getOdieTransferMessage = (): Message[] => [
	{
		content: __( 'No problem. Help is on the way!', __i18n_text_domain__ ),
		role: 'bot',
		type: 'message',
		context: {
			flags: {
				hide_disclaimer_content: true,
				show_contact_support_msg: false,
				show_ai_avatar: false,
			},
			site_id: null,
		},
	},
];

export const getOdieOnErrorTransferMessage = (): Message[] => [
	{
		content: getOdieErrorMessage(),
		role: 'bot',
		type: 'message',
		context: {
			flags: {
				hide_disclaimer_content: true,
				show_contact_support_msg: false,
				show_ai_avatar: true,
			},
			site_id: null,
		},
	},
];

export const getOdieThirdPartyMessageContent = (): string =>
	`${ __(
		'I’m happy to connect you to a human! However, it looks like 3rd party cookies are disabled in your browser. Please turn them on for our live chat to work properly. [Use our guide](https://wordpress.com/support/third-party-cookies/)',
		__i18n_text_domain__
	) } \n\n ${ __(
		'Once you’re done, you can come back here to start talking with someone by clicking on the following button.',
		__i18n_text_domain__
	) }`;

export const getOdieWrongFileTypeMessage = (): Message => ( {
	content: __(
		'Sorry! The file you are trying to upload is not supported. Please upload a .jpg, .png, or .gif file.',
		__i18n_text_domain__
	),
	role: 'bot',
	type: 'message',
	context: {
		flags: {
			hide_disclaimer_content: true,
			show_contact_support_msg: false,
		},
		site_id: null,
	},
} );

export const getOdieEmailFallbackMessageContent = (): string =>
	__(
		'We’re sorry, but live chat is temporarily unavailable for scheduled maintenance. Please feel free to reach out via email or check our Support Guides in the meantime.',
		__i18n_text_domain__
	);

export const getOdieEmailFallbackMessage = (): Message => ( {
	content: getOdieEmailFallbackMessageContent(),
	role: 'bot',
	type: 'message',
	context: {
		flags: {
			show_contact_support_msg: false,
			forward_to_human_support: true,
		},
		question_tags: {
			inquiry_type: 'request-for-human-support',
		},
		site_id: null,
	},
} );

const getOdieInitialPromptContext = ( botNameSlug: OdieAllowedBots ): Context | undefined => {
	switch ( botNameSlug ) {
		case 'wpcom-plan-support':
			return {
				flags: {
					forward_to_human_support: true,
				},
				site_id: null,
			};
		default:
			return undefined;
	}
};

export const getOdieInitialMessage = ( botNameSlug: OdieAllowedBots ): Message => {
	return {
		content: __(
			'👋 Howdy, I’m WordPress.com’s support assistant. I can help with questions about your site or account.',
			__i18n_text_domain__
		),
		role: 'bot',
		type: 'introduction',
		context: getOdieInitialPromptContext( botNameSlug ),
	};
};

export const ODIE_THUMBS_DOWN_RATING_VALUE = 0;
export const ODIE_THUMBS_UP_RATING_VALUE = 1;
export const ODIE_ALLOWED_BOTS = [ 'wpcom-support-chat', 'wpcom-plan-support' ];
