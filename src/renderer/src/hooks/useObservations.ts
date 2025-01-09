import { useManyDocs } from '@comapeo/core-react'

export function useAllObservations(projectId?: string) {
	return useManyDocs({
		projectId: projectId || '',
		docType: 'observation',
		includeDeleted: false,
		lang: 'en',
	})
}
