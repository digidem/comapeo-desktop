import type { MapeoClientApi } from '@comapeo/ipc/client.js'
import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import type { LocaleState } from '../../../shared/intl'

export interface RootRouterContext {
	activeProjectId: string | null
	clientApi: MapeoClientApi
	localeState: LocaleState
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
	component: RouteComponent,
})

function RouteComponent() {
	return <Outlet />
}
