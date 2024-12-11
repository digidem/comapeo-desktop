import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useApi } from '../contexts/ApiContext'

export const PROJECT_SETTINGS_KEY = 'project_settings'
export const CREATE_PROJECT_KEY = 'create_project'
export const PROJECTS_KEY = 'projects'
export const PROJECT_MEMBERS_KEY = 'project_members'

export function useAllProjects() {
	const api = useApi()

	return useQuery({
		queryKey: [PROJECTS_KEY],
		queryFn: () => {
			return api.listProjects()
		},
	})
}

export function useCreateProject() {
	const api = useApi()
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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] })
			queryClient.invalidateQueries({ queryKey: [PROJECT_SETTINGS_KEY] })
		},
	})
}
