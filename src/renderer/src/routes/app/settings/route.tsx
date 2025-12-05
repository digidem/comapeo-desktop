import Box from '@mui/material/Box'
import { Outlet, createFileRoute } from '@tanstack/react-router'

import { LIGHT_GREY } from '#renderer/src/colors.ts'
import { TwoPanelLayout } from '../-components/two-panel-layout'

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
