import { Suspense } from 'react'
import { ClientApiProvider } from '@comapeo/core-react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

import { theme } from '../Theme'
import { initComapeoClient } from '../comapeo-client.js'
import { IntlProvider } from '../contexts/IntlContext'

const queryClient = new QueryClient()
const comapeoClient = initComapeoClient()

export const Route = createRootRoute({
	component: () => (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<IntlProvider>
				<QueryClientProvider client={queryClient}>
					<ClientApiProvider clientApi={comapeoClient}>
						<Suspense fallback={<CircularProgress />}>
							<Outlet />
						</Suspense>
						<TanStackRouterDevtools />
					</ClientApiProvider>
				</QueryClientProvider>
			</IntlProvider>
		</ThemeProvider>
	),
})
