import { HelpCenterSelect } from '@automattic/data-stores';
import { HELP_CENTER_STORE } from '@automattic/help-center/src/stores';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { v4 as uuidv4 } from 'uuid';
import { ODIE_TRANSFER_MESSAGE } from '../constants';
import { emptyChat, useOdieAssistantContext } from '../context';
import { useGetZendeskConversation, useManageSupportInteraction, useOdieChat } from '../data';
import type { Chat, Message } from '../types';

/**
 * This combines the ODIE chat with the ZENDESK conversation.
 * @returns The combined chat.
 */
export const useGetCombinedChat = ( canConnectToZendesk: boolean ) => {
	const { currentSupportInteraction, conversationId, odieId, isChatLoaded } = useSelect(
		( select ) => {
			const store = select( HELP_CENTER_STORE ) as HelpCenterSelect;
			const currentSupportInteraction = store.getCurrentSupportInteraction();

			// Get the current odie chat ID
			const odieId =
				currentSupportInteraction?.events.find( ( event ) => event.event_source === 'odie' )
					?.event_external_id ?? null;

			// Get the current Zendesk conversation ID
			const conversationId =
				currentSupportInteraction?.events.find( ( event ) => event.event_source === 'zendesk' )
					?.event_external_id ?? null;

			return {
				currentSupportInteraction,
				conversationId,
				odieId,
				isChatLoaded: store.getIsChatLoaded(),
			};
		},
		[]
	);

	const [ mainChatState, setMainChatState ] = useState< Chat >( emptyChat );
	const chatStatus = mainChatState?.status;
	const getZendeskConversation = useGetZendeskConversation();
	const { data: odieChat, isFetching: isOdieChatLoading } = useOdieChat( Number( odieId ) );
	const { startNewInteraction } = useManageSupportInteraction();
	const { trackEvent } = useOdieAssistantContext();
	const canFetchConversation = conversationId && canConnectToZendesk;

	useEffect( () => {
		if ( ! currentSupportInteraction || isOdieChatLoading || chatStatus !== 'loading' ) {
			return;
		}

		if ( ! canFetchConversation ) {
			setMainChatState( {
				...( odieChat ? odieChat : emptyChat ),
				conversationId: null,
				supportInteractionId: currentSupportInteraction.uuid,
				provider: 'odie',
				status: 'loaded',
			} );
		} else if ( isChatLoaded && canFetchConversation ) {
			try {
				getZendeskConversation( {
					chatId: odieChat?.odieId,
					conversationId: conversationId.toString(),
				} )?.then( ( conversation ) => {
					if ( conversation ) {
						const filteredOdieMessages =
							odieChat?.messages.filter(
								( message ) => ! message.context?.flags?.forward_to_human_support
							) ?? [];
						setMainChatState( {
							...( odieChat ? odieChat : {} ),
							supportInteractionId: currentSupportInteraction!.uuid,
							conversationId: conversation.id,
							messages: [
								...( odieChat ? filteredOdieMessages : [] ),
								...( odieChat ? ODIE_TRANSFER_MESSAGE : [] ),
								...( conversation.messages as Message[] ),
							],
							provider: 'zendesk',
							status: currentSupportInteraction?.status === 'closed' ? 'closed' : 'loaded',
						} );
					}
				} );
			} catch ( error ) {
				// Conversation id was passed but the conversion was not found. Something went wrong.
				trackEvent( 'zendesk_conversation_not_found', {
					conversationId,
					odieId,
				} );

				startNewInteraction( {
					event_source: 'help-center',
					event_external_id: uuidv4(),
				} );
			}
		}
	}, [
		isOdieChatLoading,
		chatStatus,
		isChatLoaded,
		odieChat,
		conversationId,
		odieId,
		currentSupportInteraction,
		canConnectToZendesk,
		getZendeskConversation,
		startNewInteraction,
		trackEvent,
	] );

	// This effect sets the initial loading state when interaction is set, so that the chat is loaded
	useEffect( () => {
		if ( ! currentSupportInteraction?.uuid ) {
			return;
		}

		setMainChatState( ( prevChat ) => {
			if ( odieId || conversationId ) {
				// when we have the same support interaction we don't need to load the messages
				if ( prevChat?.supportInteractionId === currentSupportInteraction!.uuid ) {
					return {
						...prevChat,
						status: 'loaded',
					};
				}

				return {
					...prevChat,
					supportInteractionId: currentSupportInteraction!.uuid,
					status: 'loading',
				};
			}

			// empty chat nothing to load
			return {
				...emptyChat,
				supportInteractionId: currentSupportInteraction!.uuid,
				status: 'loaded',
			};
		} );
	}, [ currentSupportInteraction?.uuid, odieId, conversationId ] );

	return { mainChatState, setMainChatState };
};
