import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Text } from '../../components/Text'

export const Route = createFileRoute('/(MapTabs)/_Map/tab2')({
	component: Settings,
})

export function Settings() {
	return (
		<div>
			<Text>Tab 2</Text>
		</div>
	)
}
