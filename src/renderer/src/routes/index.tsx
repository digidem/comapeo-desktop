import * as React from 'react'
import { useOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()
	const { data } = useOwnDeviceInfo()
	const hasCreatedDeviceName = data?.name !== undefined

	React.useEffect(() => {
		if (!hasCreatedDeviceName) {
			router.navigate({ to: '/Onboarding' })
		} else {
			router.navigate({ to: '/tab1' })
		}
	}, [hasCreatedDeviceName])

	return (
		<Box sx={{ display: 'flex' }}>
			<CircularProgress />
		</Box>
	)
}
