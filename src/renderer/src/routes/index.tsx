import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	beforeLoad: ({ context }) => {
		if (!context.hasDeviceName) {
			throw redirect({ to: '/Onboarding' })
		}
		if (!context.persistedProjectId) {
			throw redirect({ to: '/Onboarding/CreateJoinProjectScreen' })
		}
		throw redirect({ to: '/tab1' })
	},
})
