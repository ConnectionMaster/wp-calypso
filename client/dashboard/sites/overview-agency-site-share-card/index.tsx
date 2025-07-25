import { useQuery } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { link } from '@wordpress/icons';
import { sitePreviewLinksQuery } from '../../app/queries/site-preview-links';
import OverviewCard from '../overview-card';
import type { Site } from '../../data/types';

export default function AgencySiteShareCard( { site }: { site: Site } ) {
	const { data: links = [] } = useQuery( sitePreviewLinksQuery( site.ID ) );
	const heading = links.length > 0 ? __( 'Preview link enabled' ) : __( 'Share a preview link' );

	return (
		<OverviewCard
			icon={ link }
			heading={ heading }
			description={ __( 'Collaborators with the link can view your site' ) }
			link={ `/sites/${ site.slug }/settings/site-visibility` }
			title={ __( 'Share' ) }
			tracksId="agency-site-share"
		/>
	);
}
