import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
	'/app/projects/$projectId/observations/$observationDocId/',
)({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div>Hello "/app/projects/$projectId/observations/$observationDocId/"!</div>
	)
}
