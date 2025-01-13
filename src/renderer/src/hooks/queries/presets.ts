import { useManyDocs } from '@comapeo/core-react'

export function useAllPresets(projectId?: string) {
	return useManyDocs({
		projectId: projectId || '',
		docType: 'preset',
		includeDeleted: false,
		lang: 'en',
	})
}
