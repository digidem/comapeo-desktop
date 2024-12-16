import { getProjectsQueryKey, useClientApi } from '@comapeo/core-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const CREATE_PROJECT_KEY = 'create_project'

export function useCreateProject() {
	const api = useClientApi()
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: [CREATE_PROJECT_KEY],
		mutationFn: (name?: string) => {
			return api.createProject({ name })
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: getProjectsQueryKey(),
			})
		},
	})
}
