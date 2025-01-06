import { Suspense } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import { Outlet, createRootRoute } from '@tanstack/react-router'

import { InviteListener } from './InviteListener'

export const Route = createRootRoute({
	component: () => (
		<Suspense fallback={<CircularProgress />}>
			<InviteListener />
			<Outlet />
		</Suspense>
	),
})
