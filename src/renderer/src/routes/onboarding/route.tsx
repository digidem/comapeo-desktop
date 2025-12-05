import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '#renderer/src/lib/comapeo.ts'

export const Route = createFileRoute('/onboarding')({
	beforeLoad: async ({ context }) => {
		const { activeProjectIdStore, clientApi, queryClient } = context

		const activeProjectId = activeProjectIdStore.instance.getState()

		if (activeProjectId) {
			throw redirect({
				to: '/app/projects/$projectId',
				params: { projectId: activeProjectId },
				replace: true,
			})
		}

		// NOTE: Accounts for when the active project ID is somehow missing
		// but there are already projects that have been created/joined.
		// The better solution is probably a project selection page of some sort,
		// as opposed to automatic redirection to a valid project.

		const projects = await queryClient.ensureQueryData({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects'],
			queryFn: async () => {
				return clientApi.listProjects()
			},
		})

		const projectToUse = projects[0]

		if (projectToUse) {
			throw redirect({
				to: '/app/projects/$projectId',
				params: { projectId: projectToUse.projectId },
				replace: true,
			})
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	return <Outlet />
}
