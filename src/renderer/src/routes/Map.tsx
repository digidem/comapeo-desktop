import * as React from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'

import { Text } from '../components/Text'

export const Route = createFileRoute('/Map')({
	component: MapComponent,
	loader: () => ({
		crumb: 'Map',
	}),
})

function MapComponent() {
	return (
		<>
			<div className="flex items-center border-b">
				<Text kind="title">Map</Text>
			</div>
			<hr />
			<Outlet />
		</>
	)
}
