import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/projects/$projectId/')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/app/projects/$projectId/"!</div>
}
