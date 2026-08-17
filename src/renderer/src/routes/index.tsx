import { createFileRoute } from '@tanstack/react-router'

import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../lib/comapeo.ts'
import { getItem, removeItem } from '../lib/local-storage.ts'

export const Route = createFileRoute('/')({
	beforeLoad: async ({ context }) => {
		const { activeProjectIdStore, clientApi, queryClient } = context

		const ownDeviceInfo = await queryClient.fetchQuery({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
			queryFn: async () => {
				return clientApi.getDeviceInfo()
			},
		})

		// NOTE: Implicit check that the user hasn't completed the onboarding yet.
		if (!ownDeviceInfo.name) {
			// NOTE: Clear any persisted state related to last active project
			removeItem('use_active_project_id_for_initial_route')
			activeProjectIdStore.actions.update(undefined)

			throw Route.redirect({ to: '/welcome', replace: true })
		}

		const shouldUseActiveProjectIdForInitialRoute = getItem(
			'use_active_project_id_for_initial_route',
		)

		if (shouldUseActiveProjectIdForInitialRoute) {
			const activeProjectId = activeProjectIdStore.instance.getState()

			if (activeProjectId) {
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
		}

		// NOTE: Could not make use of the active project ID stored
		// so we remove persisted items related to using it when opening the app.
		removeItem('use_active_project_id_for_initial_route')
		activeProjectIdStore.actions.update(undefined)

		throw Route.redirect({ to: '/app', replace: true })
	},
})
