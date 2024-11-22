import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { Text } from '../../components/Text'

export const Route = createFileRoute('/_Map/_Map/tab1')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div>
			<Text>Tab 1</Text>
			<Link to="/tab2">link to tab 2</Link>
		</div>
	)
}
