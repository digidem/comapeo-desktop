import * as React from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_Map/_Map')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div>
			<Outlet />
			<div>map component here</div>
		</div>
	)
}
