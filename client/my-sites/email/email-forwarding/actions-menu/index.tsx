import { ConfirmationDialog } from '@automattic/components';
import {
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	DropdownMenu,
} from '@wordpress/components';
import { rotateLeft, trash, moreHorizontalMobile } from '@wordpress/icons';
import { useTranslate } from 'i18n-calypso';
import { useState } from 'react';
import { getEmailForwardAddress } from 'calypso/lib/emails';
import { useResend, useRemove } from '../hooks';
import type { Mailbox } from '../../../../data/emails/types';
import './style.scss';

export const ActionsMenu = ( { mailbox }: { mailbox: Mailbox } ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const remove = useRemove( { mailbox } );
	const resend = useResend( { mailbox } );
	const translate = useTranslate();

	const handleConfirm = () => {
		remove( mailbox.mailbox, mailbox.domain, getEmailForwardAddress( mailbox ) );
		setIsOpen( false );
	};

	const handleCancel = () => {
		setIsOpen( false );
	};

	return (
		<>
			<ConfirmationDialog
				isOpen={ isOpen }
				onConfirm={ handleConfirm }
				onCancel={ handleCancel }
				cancelButtonText={ translate( 'Cancel' ) }
				confirmButtonText={ translate( 'Remove' ) }
			>
				<VStack>
					<Heading level={ 3 }>
						{ translate( 'Are you sure you want to remove this email forward?' ) }
					</Heading>
					<Text>
						{ translate(
							"This will remove it from our records and if it's not used in another forward, it will require reverification if added again."
						) }
					</Text>
				</VStack>
			</ConfirmationDialog>
			<DropdownMenu
				icon={ moreHorizontalMobile }
				label={ translate( 'More options' ) }
				controls={
					mailbox.warnings?.length
						? [
								{
									title: 'Resend',
									icon: rotateLeft,
									onClick: () =>
										resend( mailbox.mailbox, mailbox.domain, getEmailForwardAddress( mailbox ) ),
								},
								{
									title: 'Remove',
									icon: trash,
									onClick: () => setIsOpen( true ),
								},
						  ]
						: [
								{
									title: 'Remove',
									icon: trash,
									onClick: () => setIsOpen( true ),
								},
						  ]
				}
			/>
		</>
	);
};
