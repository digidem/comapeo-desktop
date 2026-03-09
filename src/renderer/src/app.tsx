import { StrictMode, Suspense, type ReactElement } from 'react'
import { ClientApiProvider } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { init as initSentryElectron } from '@sentry/electron/renderer'
import {
	captureException,
	init as initSentryReact,
	tanstackRouterBrowserTracingIntegration,
} from '@sentry/react'
import {
	QueryClient,
	QueryClientProvider,
	useSuspenseQuery,
} from '@tanstack/react-query'
import {
	DEFAULT_PROTOCOL_ALLOWLIST,
	RouterProvider,
	createHashHistory,
	createRouter,
} from '@tanstack/react-router'
import { useIntl, type IntlShape } from 'react-intl'

import type { LocaleState } from '../../shared/intl.ts'
import { WHITE } from './colors.ts'
import { initComapeoClient } from './comapeo-client.ts'
import { AppTitleBar } from './components/app-title-bar.tsx'
import { GenericRouteErrorComponent } from './components/generic-route-error-component.tsx'
import { GenericRouteNotFoundComponent } from './components/generic-route-not-found-component.tsx'
import { GenericRoutePendingComponent } from './components/generic-route-pending-component.tsx'
import {
	ActiveProjectIdStoreProvider,
	createActiveProjectIdStore,
} from './contexts/active-project-id-store-context.ts'
import { IntlProvider } from './contexts/intl.tsx'
import {
	LocalPeersStoreProvider,
	createLocalPeersStore,
} from './contexts/local-peers-store-context.ts'
import {
	RefreshTokensStoreProvider,
	createRefreshTokensStore,
} from './contexts/refresh-tokens-store-context.ts'
import { routeTree } from './generated/routeTree.gen.ts'
import { useNetworkConnectionChangeListener } from './hooks/network.ts'
import { DIALOG_CONTAINER_ID, TITLE_BAR_HEIGHT } from './lib/constants.ts'
import { getLocaleStateQueryOptions } from './lib/queries/app-settings.ts'
import { createTheme } from './theme.ts'

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
		clientApi,
		history: hashHistory,
		queryClient,
		// NOTE: Populated at render time
		activeProjectIdStore: undefined!,
		// NOTE: Populated at render time
		formatMessage: undefined!,
		// NOTE: Populated at render time
		localeState: undefined!,
	},
	defaultPreload: 'intent',
	// Since we're using React Query, we don't want loader calls to ever be stale
	// This will ensure that the loader is always called when the route is preloaded or visited
	defaultPreloadStaleTime: 0,
	scrollRestoration: true,
	defaultErrorComponent: GenericRouteErrorComponent,
	defaultPendingComponent: GenericRoutePendingComponent,
	defaultNotFoundComponent: ({ data }) => (
		<GenericRouteNotFoundComponent data={data} backgroundColor={WHITE} />
	),
	notFoundMode: 'fuzzy',
	protocolAllowlist: [
		...DEFAULT_PROTOCOL_ALLOWLIST,
		// Accounts for our custom protocol so that the router doesn't consider it dangerous.
		// We are responsible for doing safety checks related to accessing resources using this protocol,
		// which is handled in the protocol handler that's implemented in the main process.
		'comapeo:',
	],
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

const sentryConfig = window.runtime.getSentryConfig()

initSentryElectron(
	{
		enabled: sentryConfig.enabled,
		// TODO: Enable tracing based on user consent in production
		tracesSampleRate: sentryConfig.environment === 'production' ? 0 : 1.0,
		// TODO: Enable router integration based on user consent in production
		integrations:
			sentryConfig.environment === 'production'
				? undefined
				: [tanstackRouterBrowserTracingIntegration(router)],
		debug: sentryConfig.environment === 'development',
		initialScope: { user: { id: sentryConfig.userId } },
	},
	initSentryReact,
)

const { platform } = window.runtime.getAppInfo()

const theme = createTheme({ platform })

const MAIN_CONTENT_HEIGHT =
	platform === 'darwin' ? `calc(100% - ${TITLE_BAR_HEIGHT})` : '100%'

const refreshTokensStore = createRefreshTokensStore()
const localPeersStore = createLocalPeersStore({ clientApi })
const activeProjectIdStore = createActiveProjectIdStore({
	initialValue: window.runtime.getInitialProjectId(),
})

activeProjectIdStore.instance.subscribe((state) => {
	sessionStorage.setItem(
		// NOTE: Used by `window.runtime.getInitialProjectId()`
		'comapeo:active_project_id',
		state === undefined ? '' : state,
	)

	window.runtime.setActiveProjectId(state).catch((err) => {
		captureException(err)
	})
})

localPeersStore.actions.subscribe()

export function App() {
	return (
		<StrictMode>
			<ThemeProvider theme={theme}>
				<CssBaseline enableColorScheme />

				<RefreshTokensStoreProvider value={refreshTokensStore}>
					<ActiveProjectIdStoreProvider value={activeProjectIdStore}>
						<QueryClientProvider client={queryClient}>
							<IntlProvider>
								<NetworkConnectionChangeListener />

								<Box height="100dvh">
									{platform === 'darwin' ? (
										<AppTitleBar platform={platform} testId="app-title-bar" />
									) : null}

									<Box id={DIALOG_CONTAINER_ID} height={MAIN_CONTENT_HEIGHT}>
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
												<LocalPeersStoreProvider value={localPeersStore}>
													<WithAddedRouteContext>
														{({ formatMessage, localeState }) => (
															<RouterProvider
																router={router}
																context={{
																	activeProjectIdStore,
																	formatMessage,
																	localeState,
																}}
															/>
														)}
													</WithAddedRouteContext>
												</LocalPeersStoreProvider>
											</ClientApiProvider>
										</Suspense>
									</Box>
								</Box>
							</IntlProvider>
						</QueryClientProvider>
					</ActiveProjectIdStoreProvider>
				</RefreshTokensStoreProvider>
			</ThemeProvider>
		</StrictMode>
	)
}

function NetworkConnectionChangeListener() {
	useNetworkConnectionChangeListener()
	return null
}

function WithAddedRouteContext({
	children,
}: {
	children: (props: {
		formatMessage: IntlShape['formatMessage']
		localeState: LocaleState
	}) => ReactElement
}) {
	const { formatMessage } = useIntl()

	const { data: localeState } = useSuspenseQuery(getLocaleStateQueryOptions())

	return children({ formatMessage, localeState })
}
