import wpcom from 'calypso/lib/wp';

export interface StagingSite {
	id: number;
	name: string;
	url: string;
	user_has_permission: boolean;
}

export async function createStagingSite( siteId: number ) {
	return wpcom.req.post( {
		path: `/sites/${ siteId }/staging-site`,
		apiNamespace: 'wpcom/v2',
	} );
}

export async function deleteStagingSite( stagingSiteId: number, productionSiteId: number ) {
	return wpcom.req.post( {
		method: 'DELETE',
		path: `/sites/${ productionSiteId }/staging-site/${ stagingSiteId }`,
		apiNamespace: 'wpcom/v2',
	} );
}

export async function fetchStagingSiteOf(
	productionSiteId: number
): Promise< Array< StagingSite > > {
	return wpcom.req.get( {
		path: `/sites/${ productionSiteId }/staging-site`,
		apiNamespace: 'wpcom/v2',
	} );
}
