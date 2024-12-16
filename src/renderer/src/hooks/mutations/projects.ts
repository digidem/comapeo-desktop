import {
	getProjectSettingsQueryKey,
	getProjectsQueryKey,
	useClientApi,
} from '@comapeo/core-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const CREATE_PROJECT_KEY = 'create_project'

export function useCreateProject() {
	const api = useClientApi()
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: [CREATE_PROJECT_KEY],
		mutationFn: (opts?: Parameters<typeof api.createProject>[0]) => {
			if (opts) {
				return api.createProject(opts)
			} else {
				// Have to avoid passing `undefined` explicitly
				// See https://github.com/digidem/comapeo-mobile/issues/392
				return api.createProject()
			}
		},
		onSuccess: (projectId: string) => {
			queryClient.invalidateQueries({
				queryKey: getProjectsQueryKey(),
			})
			queryClient.invalidateQueries({
				queryKey: getProjectSettingsQueryKey({ projectId: projectId }),
			})
		},
	})
}
