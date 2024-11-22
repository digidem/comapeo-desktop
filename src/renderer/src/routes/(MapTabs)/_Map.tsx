import * as React from 'react'
import { Paper } from '@mui/material'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'

import type { FileRoutesById } from '../../routeTree.gen'

export const Route = createFileRoute('/(MapTabs)/_Map')({
	component: RouteComponent,
})

function RouteComponent() {
	const navigate = useNavigate()
	const renderCount = React.useRef(0)
	renderCount.current = renderCount.current + 1
	return (
		<div>
			<Tabs
				onChange={(_, value) => navigate({ to: value as MapTabRoute })}
				orientation="vertical"
			>
				<MapTab label="Tab 1" value={'/tab1'} />
				<MapTab label="Tab 2" value={'/tab2'} />
			</Tabs>
			<Paper>
				<Outlet />
			</Paper>
			<div>map component here</div>
			<div>parent map component render count: {renderCount.current}</div>
		</div>
	)
}

type TabProps = React.ComponentProps<typeof Tab>

type MapTabRoute = {
	[K in keyof FileRoutesById]: K extends `${'/(MapTabs)/_Map'}${infer Rest}`
		? Rest extends ''
			? never
			: `${Rest}`
		: never
}[keyof FileRoutesById]

type MapTabProps = Omit<TabProps, 'value'> & { value: MapTabRoute }

function MapTab(props: MapTabProps) {
	return <Tab {...props} />
}
