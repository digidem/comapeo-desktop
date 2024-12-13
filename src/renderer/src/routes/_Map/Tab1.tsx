import * as React from 'react'
import { useManyDocs } from '@comapeo/core-react'
import { createFileRoute } from '@tanstack/react-router'

import { Text } from '../../components/Text'
import { useActiveProjectId } from '../../contexts/ActiveProjectIdStore'

export const Route = createFileRoute('/_Map/Tab1')({
	component: RouteComponent,
})

function RouteComponent() {
	const projectId = useActiveProjectId()
	const { data: observations } = useManyDocs({
		projectId,
		docType: 'observation',
	})
	return (
		<div>
			<Text>Tab 1</Text>
			<Text>{`Number of observations: ${observations.length}`}</Text>
		</div>
	)
}
