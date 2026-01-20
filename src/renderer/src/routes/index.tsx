import { createFileRoute } from '@tanstack/react-router'

import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../lib/comapeo'

export const Route = createFileRoute('/')({
	beforeLoad: async ({ context }) => {
		const { queryClient, clientApi, activeProjectIdStore } = context

		const ownDeviceInfo = await queryClient.ensureQueryData({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
			queryFn: async () => {
				return clientApi.getDeviceInfo()
			},
		})

		// NOTE: Implicit check that the user hasn't completed the onboarding yet.
		if (!ownDeviceInfo.name) {
			throw Route.redirect({ to: '/welcome', replace: true })
		}

		const activeProjectId = activeProjectIdStore.instance.getState()

		if (activeProjectId) {
			throw Route.redirect({
				to: '/app/projects/$projectId',
				params: { projectId: activeProjectId },
				replace: true,
			})
		}

		// NOTE: Accounts for when the active project ID is somehow missing
		// but there are already projects that have been created/joined.
		// The better solution is probably a project selection page of some sort,
		// as opposed to automatic redirection to a valid project.

		const projects = await queryClient.fetchQuery({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects'],
			queryFn: async () => {
				return clientApi.listProjects()
			},
		})

		const projectToUse = projects[0]

		if (projectToUse) {
			throw Route.redirect({
				to: '/app/projects/$projectId',
				params: { projectId: projectToUse.projectId },
				replace: true,
			})
		}

		throw Route.redirect({
			to: '/onboarding/project',
			replace: true,
		})
	},
	component: RouteComponent,
})

function RouteComponent() {
	throw new Error('Should not have landed on this page!')
}
