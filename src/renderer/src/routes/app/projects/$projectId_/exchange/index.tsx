import { createFileRoute } from '@tanstack/react-router'

import { TwoPanelLayout } from '../../../-components/two-panel-layout'

export const Route = createFileRoute('/app/projects/$projectId_/exchange/')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<TwoPanelLayout
			start={<div>Hello "/app/projects/$projectId_/exchange/"!</div>}
			end={null}
		/>
	)
}
