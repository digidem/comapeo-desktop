import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Text } from '../../components/Text'
import { usePersistedProjectIdStore } from '../../contexts/persistedState/PersistedProjectId'

export const Route = createFileRoute('/(MapTabs)/_Map/tab1')({
	component: RouteComponent,
})

function RouteComponent() {
	const projectId = usePersistedProjectIdStore((store) => store.projectId)
	return (
		<div>
			<Text>Tab 1</Text>
			<Text>{projectId}</Text>
		</div>
	)
}
