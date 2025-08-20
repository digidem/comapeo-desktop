import { StrictMode, Suspense, type ReactElement, type ReactNode } from 'react'
import {
	ClientApiProvider,
	useSetUpInvitesListeners,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { init as initSentryElectron } from '@sentry/electron/renderer'
import {
	init as initSentryReact,
	tanstackRouterBrowserTracingIntegration,
} from '@sentry/react'
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
import { useIntl, type IntlShape } from 'react-intl'

import type { LocaleState } from '../../shared/intl'
import { initComapeoClient } from './comapeo-client'
import { AppTitleBar, TITLE_BAR_HEIGHT } from './components/app-title-bar'
import { GenericRouteErrorComponent } from './components/generic-route-error-component'
import { GenericRoutePendingComponent } from './components/generic-route-pending-component'
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
		// NOTE: Populated at render time
		localeState: undefined!,
		// NOTE: Populated at render time
		formatMessage: undefined!,
	},
	defaultPreload: 'intent',
	// Since we're using React Query, we don't want loader calls to ever be stale
	// This will ensure that the loader is always called when the route is preloaded or visited
	defaultPreloadStaleTime: 0,
	scrollRestoration: true,
	defaultErrorComponent: GenericRouteErrorComponent,
	defaultPendingComponent: GenericRoutePendingComponent,
	notFoundMode: 'fuzzy',
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

const sentryConfig = window.runtime.getSentryConfig()

initSentryElectron(
	{
		dsn: 'https://f7336c12cc39fb0367886e31036a6cd7@o4507148235702272.ingest.us.sentry.io/4509803831820288',
		enabled: sentryConfig.enabled,
		// TODO: Enable tracing based on user consent in production
		tracesSampleRate: sentryConfig.environment === 'production' ? 0 : 1.0,
		// TODO: Enable router integration based on user consent in production
		integrations:
			sentryConfig.environment === 'production'
				? undefined
				: [tanstackRouterBrowserTracingIntegration(router)],
		environment: sentryConfig.environment,
		debug: sentryConfig.environment === 'development',
		initialScope: { user: { id: sentryConfig.userId } },
	},
	initSentryReact,
)

const { platform } = window.runtime.getAppInfo()

const MAIN_CONTENT_HEIGHT = `calc(100% - ${TITLE_BAR_HEIGHT})`

export function App() {
	return (
		<StrictMode>
			<ThemeProvider theme={theme}>
				<CssBaseline enableColorScheme />

				<QueryClientProvider client={queryClient}>
					<IntlProvider>
						<NetworkConnectionChangeListener />

						<Box height="100dvh">
							<AppTitleBar platform={platform} />

							<Box height={MAIN_CONTENT_HEIGHT}>
								<Suspense
									fallback={
										<Box
											display="flex"
											justifyContent="center"
											alignItems="center"
											height="100%"
										>
											<CircularProgress />
										</Box>
									}
								>
									<ClientApiProvider clientApi={clientApi}>
										<WithInvitesListener>
											<WithAddedRouteContext>
												{({ activeProjectId, formatMessage, localeState }) => (
													<RouterProvider
														router={router}
														context={{
															activeProjectId,
															formatMessage,
															localeState,
														}}
													/>
												)}
											</WithAddedRouteContext>
										</WithInvitesListener>
									</ClientApiProvider>
								</Suspense>
							</Box>
						</Box>
					</IntlProvider>
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
		formatMessage: IntlShape['formatMessage']
		localeState: LocaleState
	}) => ReactElement
}) {
	const { formatMessage } = useIntl()

	const { data: activeProjectId } = useSuspenseQuery(
		getActiveProjectIdQueryOptions(),
	)

	const { data: localeState } = useSuspenseQuery(getLocaleStateQueryOptions())

	return children({ activeProjectId, formatMessage, localeState })
}
