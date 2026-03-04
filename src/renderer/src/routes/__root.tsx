import type { MapeoClientApi } from '@comapeo/ipc/client.js'
import type { QueryClient } from '@tanstack/react-query'
import {
	Outlet,
	createRootRouteWithContext,
	type RouterHistory,
} from '@tanstack/react-router'
import type { IntlShape } from 'react-intl'

import type { LocaleState } from '../../../shared/intl.ts'
import type { ActiveProjectIdStore } from '../contexts/active-project-id-store-context.ts'
import type { GlobalEditingStateStore } from '../contexts/global-editing-state-store-context.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../lib/comapeo.ts'

export interface RootRouterContext {
	activeProjectIdStore: ActiveProjectIdStore
	clientApi: MapeoClientApi
	formatMessage: IntlShape['formatMessage']
	globalEditingStateStore: GlobalEditingStateStore
	history: RouterHistory
	localeState: LocaleState
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
	beforeLoad: async ({ context, matches }) => {
		const { queryClient, clientApi } = context

		const ownDeviceInfo = await queryClient.fetchQuery({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
			queryFn: async () => {
				return clientApi.getDeviceInfo()
			},
		})

		const currentRoute = matches.at(-1)!

		if (
			// NOTE: Implicit check that the user hasn't completed the onboarding yet.
			!ownDeviceInfo.name &&
			!(
				currentRoute.fullPath === '/welcome' ||
				currentRoute.fullPath.startsWith('/onboarding')
			)
		) {
			throw Route.redirect({ to: '/welcome', replace: true })
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	return <Outlet />
}
