import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import { theme } from './Theme'
import { ApiProvider } from './contexts/ApiContext'
import { IntlProvider } from './contexts/IntlContext'
import {
	PersistedActiveProjectIdProvider,
	createActiveProjectIdStore,
} from './contexts/persistedState/PersistedProjectId'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

const PersistedProjectIdStore = createActiveProjectIdStore({
	isPersisted: true,
})

export const App = () => (
	<ThemeProvider theme={theme}>
		<CssBaseline />
		<IntlProvider>
			<QueryClientProvider client={queryClient}>
				<PersistedActiveProjectIdProvider store={PersistedProjectIdStore}>
					<ApiProvider>
						<RouterProvider router={router} />
					</ApiProvider>
				</PersistedActiveProjectIdProvider>
			</QueryClientProvider>
		</IntlProvider>
	</ThemeProvider>
)
