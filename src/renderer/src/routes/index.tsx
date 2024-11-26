import * as React from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()
	const hasCreatedDeviceName = false
	// determine if user has created a device name
	// if they do have a device name, navigate to Map
	// Otherwise navigate to Welcome
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
