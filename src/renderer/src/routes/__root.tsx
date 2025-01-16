import { Suspense } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import { Outlet, createRootRoute } from '@tanstack/react-router'

import { InviteListener } from '../components/InviteListener'
import { InviteTestingButton } from '../components/InviteTestingButton'

export const Route = createRootRoute({
	component: () => (
		<Suspense fallback={<CircularProgress />}>
			<InviteListener />
			<Outlet />
			{process.env.NODE_ENV === 'development' && <InviteTestingButton />}
		</Suspense>
	),
})
