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
		mutationFn: (name?: string) => {
			return api.createProject({ name })
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [PROJECTS_KEY],
			})
		},
	})
}
