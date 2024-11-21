import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/Map/tab1')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>This is a component</div>
}
