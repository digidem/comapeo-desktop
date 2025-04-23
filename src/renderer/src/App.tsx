import { ClientApiProvider } from '@comapeo/core-react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	RouterProvider,
	createHashHistory,
	createRouter,
} from '@tanstack/react-router'

import { theme } from './Theme'
import { initComapeoClient } from './comapeo-client'
import {
	ActiveProjectIdProvider,
	createActiveProjectIdStore,
} from './contexts/ActiveProjectIdProvider'
import { IntlProvider } from './contexts/IntlContext'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()
const clientApi = initComapeoClient()

const hashHistory = createHashHistory()
const router = createRouter({ routeTree, history: hashHistory })

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
				<ClientApiProvider clientApi={clientApi}>
					<ActiveProjectIdProvider store={PersistedProjectIdStore}>
						<RouterProvider router={router} />
					</ActiveProjectIdProvider>
				</ClientApiProvider>
			</QueryClientProvider>
		</IntlProvider>
	</ThemeProvider>
)
