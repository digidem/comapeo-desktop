import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/privacy')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/app/privacy"!</div>
}
