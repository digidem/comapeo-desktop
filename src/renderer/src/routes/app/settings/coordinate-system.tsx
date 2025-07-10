import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/settings/coordinate-system')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/app/settings/coordinate-system"!</div>
}
