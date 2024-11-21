import * as React from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/Map')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>map page</div>
}
