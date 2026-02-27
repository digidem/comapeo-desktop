import { createFileRoute } from '@tanstack/react-router'

import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../lib/comapeo.ts'
import { LOCAL_STORAGE_KEYS } from '../lib/constants.ts'

export const Route = createFileRoute('/')({
	beforeLoad: async ({ context }) => {
		const { activeProjectIdStore, clientApi, queryClient } = context

		const shouldUseActiveProjectIdForInitialRoute =
			window.localStorage.getItem(
				LOCAL_STORAGE_KEYS.USE_ACTIVE_PROJECT_ID_FOR_INITIAL_ROUTE,
			) === 'true'

		if (shouldUseActiveProjectIdForInitialRoute) {
			const activeProjectId = activeProjectIdStore.instance.getState()

			if (!activeProjectId) {
				throw Route.redirect({ to: '/app', replace: true })
			}

			const projects = await queryClient.fetchQuery({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects'],
				queryFn: async () => {
					return clientApi.listProjects()
				},
			})

			const existingProject = projects.find(
				(p) => p.projectId === activeProjectId,
			)

			if (existingProject) {
				throw Route.redirect({
					to: '/app/projects/$projectId',
					params: { projectId: activeProjectId },
					replace: true,
				})
			}
		}

		throw Route.redirect({ to: '/app', replace: true })
	},
})
