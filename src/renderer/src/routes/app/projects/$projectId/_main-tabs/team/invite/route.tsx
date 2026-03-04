import { Outlet, createFileRoute } from '@tanstack/react-router'

import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../../../../lib/comapeo.ts'

export const Route = createFileRoute(
	'/app/projects/$projectId/_main-tabs/team/invite',
)({
	beforeLoad: async ({ context, params }) => {
		const { queryClient, projectApi } = context
		const { projectId } = params

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
			throw Route.redirect({
				to: '/app/projects/$projectId/team',
				params: { projectId },
				replace: true,
			})
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	return <Outlet />
}
