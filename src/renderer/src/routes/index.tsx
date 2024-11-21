import * as React from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()
	// determine if user has created a device name
	// if they do have a device name, navigate to Map
	// Otherwise navigate to Welcome

	router.navigate({ to: '/Welcome' })
	return (
		<Box sx={{ display: 'flex' }}>
			<CircularProgress />
		</Box>
	)
}
