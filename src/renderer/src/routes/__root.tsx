import { Suspense } from 'react'
import type { MapeoClientApi } from '@comapeo/ipc'
import CircularProgress from '@mui/material/CircularProgress'
import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

export interface RootRouterContext {
	activeProjectId: string | null
	clientApi: MapeoClientApi
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
	component: () => (
		<Suspense fallback={<CircularProgress />}>
			<Outlet />
		</Suspense>
	),
})
