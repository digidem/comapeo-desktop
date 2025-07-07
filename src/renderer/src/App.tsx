import { StrictMode, type ReactElement, type ReactNode } from 'react'
import {
	ClientApiProvider,
	useSetUpInvitesListeners,
} from '@comapeo/core-react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	RouterProvider,
	createHashHistory,
	createRouter,
} from '@tanstack/react-router'

import { initComapeoClient } from './comapeo-client'
import {
	ActiveProjectIdProvider,
	createActiveProjectIdStore,
	useActiveProjectIdStoreState,
} from './contexts/ActiveProjectIdProvider'
import { IntlProvider } from './contexts/IntlContext'
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
	context: { queryClient, clientApi, activeProjectId: undefined },
	defaultPreload: 'intent',
	// Since we're using React Query, we don't want loader calls to ever be stale
	// This will ensure that the loader is always called when the route is preloaded or visited
	defaultPreloadStaleTime: 0,
	scrollRestoration: true,
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

const persistedProjectIdStore = createActiveProjectIdStore({
	persist: true,
})

export function App() {
	return (
		<StrictMode>
			<ThemeProvider theme={theme}>
				<CssBaseline enableColorScheme />
				<IntlProvider>
					<QueryClientProvider client={queryClient}>
						<ClientApiProvider clientApi={clientApi}>
							<WithInvitesListener>
								<ActiveProjectIdProvider store={persistedProjectIdStore}>
									<WithActiveProjectId>
										{({ activeProjectId }) => (
											<RouterProvider
												router={router}
												context={{ activeProjectId }}
											/>
										)}
									</WithActiveProjectId>
								</ActiveProjectIdProvider>
							</WithInvitesListener>
						</ClientApiProvider>
					</QueryClientProvider>
				</IntlProvider>
			</ThemeProvider>
		</StrictMode>
	)
}

function WithInvitesListener({ children }: { children: ReactNode }) {
	useSetUpInvitesListeners()

	return children
}

function WithActiveProjectId({
	children,
}: {
	children: (props: { activeProjectId?: string }) => ReactElement
}) {
	const activeProjectId = useActiveProjectIdStoreState(
		(state) => state.activeProjectId,
	)

	return children({ activeProjectId })
}
