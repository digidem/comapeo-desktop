import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/settings/device-name')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/app/settings/device-name"!</div>
}
