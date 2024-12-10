import { Suspense } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

import { theme } from '../Theme'
import { ApiProvider } from '../contexts/ApiContext'
import { IntlProvider } from '../contexts/IntlContext'

const queryClient = new QueryClient()

export const Route = createRootRoute({
	component: () => (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<IntlProvider>
				<QueryClientProvider client={queryClient}>
					<ApiProvider>
						<Suspense fallback={<CircularProgress />}>
							<Outlet />
						</Suspense>
						<TanStackRouterDevtools />
					</ApiProvider>
				</QueryClientProvider>
			</IntlProvider>
		</ThemeProvider>
	),
})
