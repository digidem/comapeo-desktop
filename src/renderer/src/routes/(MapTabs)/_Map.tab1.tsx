import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Text } from '../../components/Text'

export const Route = createFileRoute('/(MapTabs)/_Map/tab1')({
	component: Observations,
})

export function Observations() {
	return (
		<div>
			<Text>Tab 1</Text>
		</div>
	)
}
