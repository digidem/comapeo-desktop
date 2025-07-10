import Box from '@mui/material/Box'
import { Outlet, createFileRoute } from '@tanstack/react-router'

import { TwoPanelLayout } from '../-components/two-panel-layout'
import { LIGHT_GREY } from '../../../colors'

export const Route = createFileRoute('/app/settings')({
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
