import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { Text } from '../../components/Text'

export const Route = createFileRoute('/_Map/_Map/tab2')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div>
			<Text>Tab 2</Text>
			<Link to="/tab1">link to tab 1</Link>
		</div>
	)
}
