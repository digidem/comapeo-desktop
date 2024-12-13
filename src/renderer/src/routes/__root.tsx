import { Suspense } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { InviteListener } from './InviteListener'

type RouterContext = {
	hasDeviceName: boolean
	persistedProjectId: boolean
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: () => (
		<Suspense fallback={<CircularProgress />}>
			<InviteListener />
			<Outlet />
		</Suspense>
	),
})
