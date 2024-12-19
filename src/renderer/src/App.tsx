import type { ReactNode } from 'react'
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

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

const PersistedProjectIdStore = createActiveProjectIdStore({
	persist: true,
})

export const App = () => (
	<ReuseableProviderWrapper>
		<QueryClientProvider client={queryClient}>
			<ApiProvider>
				<ActiveProjectIdProvider store={PersistedProjectIdStore}>
					<RouterProvider router={router} />
				</ActiveProjectIdProvider>
			</ApiProvider>
		</QueryClientProvider>
	</ReuseableProviderWrapper>
)

export const ReuseableProviderWrapper = ({
	children,
}: {
	children: ReactNode
}) => {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<IntlProvider>{children}</IntlProvider>
		</ThemeProvider>
	)
}
