import type { MapeoClientApi } from '@comapeo/ipc/client.js'
import type { QueryClient } from '@tanstack/react-query'
import {
	Outlet,
	createRootRouteWithContext,
	type RouterHistory,
} from '@tanstack/react-router'
import type { IntlShape } from 'react-intl'

import type { LocaleState } from '#shared/intl.ts'

import type { ActiveProjectIdStore } from '../contexts/active-project-id-store-context'

export interface RootRouterContext {
	activeProjectIdStore: ActiveProjectIdStore
	clientApi: MapeoClientApi
	formatMessage: IntlShape['formatMessage']
	history: RouterHistory
	localeState: LocaleState
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
	component: RouteComponent,
})

function RouteComponent() {
	return <Outlet />
}
