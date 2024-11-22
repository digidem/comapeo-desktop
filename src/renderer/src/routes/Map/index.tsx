import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Text } from '../../components/Text'

export const Route = createFileRoute('/Map/')({
	component: MapIndexComponent,
})

function MapIndexComponent() {
	return <Text kind="body">This is a component</Text>
}
