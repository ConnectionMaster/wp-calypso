import { Outlet } from '@tanstack/react-router';
import ReactDOM from 'react-dom';
import Snackbars from 'calypso/dashboard/app/snackbars';
import { PageViewTracker } from 'calypso/dashboard/components/page-view-tracker';

export default function Root() {
	return (
		<>
			<Outlet />
			{ ReactDOM.createPortal( <Snackbars />, document.body ) }
			<PageViewTracker />
		</>
	);
}
