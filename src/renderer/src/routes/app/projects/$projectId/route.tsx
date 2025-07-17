import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { Outlet, createFileRoute } from '@tanstack/react-router'

import { TwoPanelLayout } from '../../-components/two-panel-layout'
import { Map } from '../../../../components/map'

export const Route = createFileRoute('/app/projects/$projectId')({
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
