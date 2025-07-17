import { createFileRoute, redirect } from '@tanstack/react-router'

import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../lib/comapeo'

export const Route = createFileRoute('/')({
	beforeLoad: async ({ context }) => {
		const { queryClient, clientApi, activeProjectId } = context

		// TODO: not ideal to do this but requires major changes to @comapeo/core-react
		// copied from https://github.com/digidem/comapeo-core-react/blob/e56979321e91440ad6e291521a9e3ce8eb91200d/src/lib/react-query/client.ts#L21
		const ownDeviceInfo = await queryClient.ensureQueryData({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
			queryFn: async () => {
				return clientApi.getDeviceInfo()
			},
		})

		if (!ownDeviceInfo.name) {
			throw redirect({ to: '/welcome', replace: true })
		}

		if (!activeProjectId) {
			throw redirect({
				to: '/onboarding/project',
				replace: true,
			})
		}

		throw redirect({
			to: '/app/projects/$projectId',
			params: { projectId: activeProjectId },
			replace: true,
		})
	},
	component: RouteComponent,
})

function RouteComponent() {
	throw new Error('Should not have landed on this page!')
}
