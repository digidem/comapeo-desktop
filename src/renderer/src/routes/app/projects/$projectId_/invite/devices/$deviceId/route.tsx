import { Outlet, createFileRoute } from '@tanstack/react-router'

import { GenericRoutePendingComponent } from '../../../../../../../components/generic-route-pending-component'

export const Route = createFileRoute(
	'/app/projects/$projectId_/invite/devices/$deviceId',
)({
	// NOTE: We want to make sure that the device of interest is actually still detected by us and connected.
	// If it's not, then we redirect to the page that lists the discovered devices.
	beforeLoad: async ({ context, params }) => {
		const { clientApi, projectApi } = context
		const { deviceId, projectId } = params
		const peers = await clientApi.listLocalPeers()

		const matchingPeer = peers.find((p) => p.deviceId === deviceId)

		if (!matchingPeer) {
			throw Route.redirect({
				to: '/app/projects/$projectId/invite/devices',
				params: { projectId },
				replace: true,
			})
		}

		// NOTE: This is intentionally a plain call instead of something that's wrapped in
		// `queryClient.ensureQueryData()`, `queryClient.fetchQuery()`, etc.
		// This prevents an issue with showing the success state when another device accepts an invite sent by us.
		const member = await projectApi.$member.getById(deviceId).catch(() => {
			return null
		})

		// TODO: Do not redirect if member left project?
		if (member) {
			throw Route.redirect({
				to: '/app/projects/$projectId/invite/devices',
				params: { projectId },
				replace: true,
			})
		}

		return { peerOnLoad: matchingPeer }
	},
	pendingComponent: GenericRoutePendingComponent,
	component: RouteComponent,
})

function RouteComponent() {
	return <Outlet />
}
