import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/settings/background-map')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/app/settings/background-map"!</div>
}
