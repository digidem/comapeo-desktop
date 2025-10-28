import Box from '@mui/material/Box'
import {
	Outlet,
	createFileRoute,
	notFound,
	redirect,
} from '@tanstack/react-router'

import { TwoPanelLayout } from '../../../-components/two-panel-layout'
import { LIGHT_GREY } from '../../../../../colors'
import { GenericRoutePendingComponent } from '../../../../../components/generic-route-pending-component'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../../lib/comapeo'

export const Route = createFileRoute('/app/projects/$projectId/invite')({
	beforeLoad: async ({ context, params }) => {
		const { clientApi, queryClient } = context
		const { projectId } = params

		let projectApi
		try {
			// TODO: Not ideal but requires changes in @comapeo/core-react
			projectApi = await queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects', projectId],
				queryFn: async () => {
					return clientApi.getProject(projectId)
				},
			})
		} catch {
			throw notFound()
		}

		const ownRole = await queryClient.ensureQueryData({
			queryKey: [
				COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
				'projects',
				projectId,
				'role',
			],
			queryFn: async () => {
				return projectApi.$getOwnRole()
			},
		})

		const isAtLeastCoordinator =
			ownRole.roleId === CREATOR_ROLE_ID ||
			ownRole.roleId === COORDINATOR_ROLE_ID

		// TODO: Should be checking the specific role permissions instead
		// https://github.com/digidem/comapeo-mobile/issues/1316
		if (!isAtLeastCoordinator) {
			throw redirect({ to: '/', replace: true })
		}

		return { projectApi }
	},
	pendingComponent: () => {
		return (
			<TwoPanelLayout
				start={<GenericRoutePendingComponent />}
				end={<Box bgcolor={LIGHT_GREY} display="flex" flex={1} />}
			/>
		)
	},
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<TwoPanelLayout
			start={<Outlet />}
			end={<Box bgcolor={LIGHT_GREY} display="flex" flex={1} />}
		/>
	)
}
