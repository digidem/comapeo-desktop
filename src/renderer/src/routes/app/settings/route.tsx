import Box from '@mui/material/Box'
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/settings')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<Box
			component="main"
			sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}
		>
			<Outlet />
		</Box>
	)
}
