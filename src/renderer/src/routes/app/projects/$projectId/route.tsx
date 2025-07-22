import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'

import { TwoPanelLayout } from '../../-components/two-panel-layout'
import { Map } from '../../../../components/map'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../lib/comapeo'

export const Route = createFileRoute('/app/projects/$projectId')({
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

		return { projectApi }
	},
	pendingComponent: () => {
		return (
			<TwoPanelLayout
				start={
					<Box
						display="flex"
						flex={1}
						justifyContent="center"
						alignItems="center"
					>
						<CircularProgress />
					</Box>
				}
				end={
					<Box
						display="flex"
						flex={1}
						justifyContent="center"
						alignItems="center"
					>
						<CircularProgress />
					</Box>
				}
			/>
		)
	},

	component: RouteComponent,
})

function RouteComponent() {
	return <TwoPanelLayout start={<Outlet />} end={<Map />} />
}
