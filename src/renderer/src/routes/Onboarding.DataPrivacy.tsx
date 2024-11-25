import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/Onboarding/DataPrivacy')({
	component: DataPrivacyComponent,
})

function DataPrivacyComponent() {
	return (
		<div>
			<h2>Step 1: User Information</h2>
		</div>
	)
}
