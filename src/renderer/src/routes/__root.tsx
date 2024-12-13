import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

import { theme } from '../Theme'
import { ApiProvider } from '../contexts/ApiContext'
import { IntlProvider } from '../contexts/IntlContext'
import { PersistedActiveProjectProvider } from '../contexts/persistedState/PersistedProjectId'

const queryClient = new QueryClient()

export const Route = createRootRoute({
	component: () => (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<IntlProvider>
				<QueryClientProvider client={queryClient}>
					<ApiProvider>
						<PersistedActiveProjectProvider>
							<Outlet />
							<TanStackRouterDevtools />
						</PersistedActiveProjectProvider>
					</ApiProvider>
				</QueryClientProvider>
			</IntlProvider>
		</ThemeProvider>
	),
})
