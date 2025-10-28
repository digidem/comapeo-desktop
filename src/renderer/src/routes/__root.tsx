import type { MapeoClientApi } from '@comapeo/ipc/client.js'
import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { IntlShape } from 'react-intl'

import type { LocaleState } from '../../../shared/intl'
import type { ActiveProjectIdStore } from '../contexts/active-project-id-store-context'

export interface RootRouterContext {
	activeProjectIdStore: ActiveProjectIdStore
	clientApi: MapeoClientApi
	localeState: LocaleState
	queryClient: QueryClient
	formatMessage: IntlShape['formatMessage']
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
	component: RouteComponent,
})

function RouteComponent() {
	return <Outlet />
}
