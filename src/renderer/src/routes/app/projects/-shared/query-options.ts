import type { ComapeoCoreClientApi } from '@comapeo/ipc/client.js'
import { queryOptions } from '@tanstack/react-query'

import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../lib/comapeo.ts'

export function getProjectApiQueryOptions({
	clientApi,
	projectId,
}: {
	clientApi: ComapeoCoreClientApi
	projectId: string
}) {
	return queryOptions({
		queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects', projectId],
		queryFn: async () => {
			return clientApi.getProject(projectId)
		},
	})
}
