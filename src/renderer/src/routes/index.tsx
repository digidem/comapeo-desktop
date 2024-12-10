import { createFileRoute, useRouter } from '@tanstack/react-router'

import { useDeviceInfo } from '../queries/deviceInfo'

export const Route = createFileRoute('/')({
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()
	const { data } = useDeviceInfo()
	const hasCreatedDeviceName = data?.name !== undefined

	if (!hasCreatedDeviceName) {
		router.navigate({ to: '/Onboarding' })
	} else {
		router.navigate({ to: '/tab1' })
	}
}
