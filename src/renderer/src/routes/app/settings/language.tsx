import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/settings/language')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/app/settings/language"!</div>
}
