import { Suspense } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
	component: () => (
		<Suspense fallback={<CircularProgress />}>
			<Outlet />
		</Suspense>
	),
})
