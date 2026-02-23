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

		throw Route.redirect({
			to: '/app',
			replace: true,
		})
	},
})
