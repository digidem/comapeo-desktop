import { Suspense } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

type RouterContext = {
	hasDeviceName: boolean
	persistedProjectId: string | undefined
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: () => (
		<Suspense fallback={<CircularProgress />}>
			<Outlet />
		</Suspense>
	),
})
