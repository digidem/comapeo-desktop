import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Text } from '../../components/Text'
import { useGuaranteedActiveProjectId } from '../../contexts/GuaranteedActiveProjectIdProvider'

export const Route = createFileRoute('/_Map/Tab1')({
	component: Observations,
})

export function Observations() {
	const projectId = useGuaranteedActiveProjectId()
	return (
		<div>
			<Text>Tab 1</Text>
			<Text>{projectId}</Text>
		</div>
	)
}
