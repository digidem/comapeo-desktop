import { createFileRoute } from '@tanstack/react-router'

import { TwoPanelLayout } from '../../../-components/two-panel-layout'

export const Route = createFileRoute('/app/projects/$projectId_/settings/')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<TwoPanelLayout
			start={<div>Hello "/app/projects/$projectId/settings/"!</div>}
			end={null}
		/>
	)
}
