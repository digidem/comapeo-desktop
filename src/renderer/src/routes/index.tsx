import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	beforeLoad: async ({ context }) => {
		const { activeProjectIdStore } = context

		const activeProjectId = activeProjectIdStore.instance.getState()

		// TODO: Ideally only do this if last visited page was a project-related page
		if (activeProjectId) {
			throw Route.redirect({
				to: '/app/projects/$projectId',
				params: { projectId: activeProjectId },
				replace: true,
			})
		}

		throw Route.redirect({
			to: '/app',
			replace: true,
		})
	},
})
