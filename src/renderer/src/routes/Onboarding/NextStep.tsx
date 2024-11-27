import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/Onboarding/NextStep')({
	component: RouteComponent,
})

function RouteComponent() {
	return 'Hello /Onboarding/NextStep!'
}
