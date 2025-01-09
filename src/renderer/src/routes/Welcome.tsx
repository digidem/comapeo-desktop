import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { Text } from '../components/Text'

export const Route = createFileRoute('/Welcome')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div>
			<Text>Welcome Page</Text>
			<Link to={'/main'}>Map</Link>
		</div>
	)
}
