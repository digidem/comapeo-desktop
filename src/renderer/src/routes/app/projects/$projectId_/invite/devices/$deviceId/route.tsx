import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

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
			throw redirect({
				to: '/app/projects/$projectId/invite/devices',
				params: { projectId },
				replace: true,
			})
		}

		const member = await projectApi.$member.getById(deviceId).catch(() => null)

		// TODO: Do not redirect if member left project?
		if (member) {
			throw redirect({
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
