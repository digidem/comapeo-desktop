import { StrictMode, Suspense, type ReactElement, type ReactNode } from 'react'
import {
	ClientApiProvider,
	useSetUpInvitesListeners,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import {
	QueryClient,
	QueryClientProvider,
	useSuspenseQuery,
} from '@tanstack/react-query'
import {
	RouterProvider,
	createHashHistory,
	createRouter,
} from '@tanstack/react-router'

import type { LocaleState } from '../../main/types/intl'
import { initComapeoClient } from './comapeo-client'
import { GenericRouteErrorComponent } from './components/generic-route-error-component'
import { IntlProvider } from './contexts/intl'
import { useNetworkConnectionChangeListener } from './hooks/network'
import {
	getActiveProjectIdQueryOptions,
	getLocaleStateQueryOptions,
} from './lib/queries/app-settings'
import { routeTree } from './routeTree.gen'
import { theme } from './theme'

const queryClient = new QueryClient({
	// Since the API is running locally, queries should run regardless of network
	// status, and should not be retried. In React Native the API consumer would
	// have to manually set the network mode, but we still should keep these options
	// to avoid surprises. Not using the queryClient `defaultOptions` because the API
	// consumer might also use the same queryClient for network queries
	defaultOptions: {
		queries: {
			networkMode: 'always',
			retry: false,
		},
		mutations: {
			networkMode: 'always',
			retry: false,
		},
	},
})

const clientApi = initComapeoClient()
const hashHistory = createHashHistory()

const router = createRouter({
	routeTree,
	history: hashHistory,
	context: {
		queryClient,
		clientApi,
		activeProjectId: null,
		localeState: undefined!,
	},
	defaultPreload: 'intent',
	// Since we're using React Query, we don't want loader calls to ever be stale
	// This will ensure that the loader is always called when the route is preloaded or visited
	defaultPreloadStaleTime: 0,
	scrollRestoration: true,
	defaultErrorComponent: GenericRouteErrorComponent,
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

export function App() {
	return (
		<StrictMode>
			<ThemeProvider theme={theme}>
				<CssBaseline enableColorScheme />
				<QueryClientProvider client={queryClient}>
					<NetworkConnectionChangeListener />

					<Suspense
						fallback={
							<Box
								height="100vh"
								display="flex"
								justifyContent="center"
								alignItems="center"
							>
								<CircularProgress />
							</Box>
						}
					>
						<IntlProvider>
							<ClientApiProvider clientApi={clientApi}>
								<WithInvitesListener>
									<WithAddedRouteContext>
										{({ activeProjectId, localeState }) => (
											<RouterProvider
												router={router}
												context={{ activeProjectId, localeState }}
											/>
										)}
									</WithAddedRouteContext>
								</WithInvitesListener>
							</ClientApiProvider>
						</IntlProvider>
					</Suspense>
				</QueryClientProvider>
			</ThemeProvider>
		</StrictMode>
	)
}

function NetworkConnectionChangeListener() {
	useNetworkConnectionChangeListener()
	return null
}

function WithInvitesListener({ children }: { children: ReactNode }) {
	useSetUpInvitesListeners()

	return children
}

function WithAddedRouteContext({
	children,
}: {
	children: (props: {
		activeProjectId: string | null
		localeState: LocaleState
	}) => ReactElement
}) {
	const { data: activeProjectId } = useSuspenseQuery(
		getActiveProjectIdQueryOptions(),
	)

	const { data: localeState } = useSuspenseQuery(getLocaleStateQueryOptions())

	return children({ activeProjectId, localeState })
}
