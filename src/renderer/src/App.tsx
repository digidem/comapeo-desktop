import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import { theme } from './Theme'
import {
	ActiveProjectIdProvider,
	createActiveProjectIdStore,
} from './contexts/ActiveProjectIdProvider'
import { ApiProvider } from './contexts/ApiContext'
import { IntlProvider } from './contexts/IntlContext'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

const PersistedProjectIdStore = createActiveProjectIdStore({
	persist: true,
})

export const App = () => (
	<ThemeProvider theme={theme}>
		<CssBaseline />
		<IntlProvider>
			<QueryClientProvider client={queryClient}>
				<ActiveProjectIdProvider store={PersistedProjectIdStore}>
					<ApiProvider>
						<RouterProvider router={router} />
					</ApiProvider>
				</ActiveProjectIdProvider>
			</QueryClientProvider>
		</IntlProvider>
	</ThemeProvider>
)
