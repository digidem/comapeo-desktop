import type { ReactNode } from 'react'
import { ThemeProvider } from '@emotion/react'
import { CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { App } from './App'
import { theme } from './Theme'
import { ApiProvider } from './contexts/ApiContext'
import { IntlProvider } from './contexts/IntlContext'
import { PersistedProjectIdProvider } from './contexts/persistedState/PersistedProjectId'

const queryClient = new QueryClient()

export const AppWrapper = () => {
	return (
		<ApiProvider>
			<PersistedProjectIdProvider>
				<ReuseableProviderWrapper>
					<App />
				</ReuseableProviderWrapper>
			</PersistedProjectIdProvider>
		</ApiProvider>
	)
}

export const ReuseableProviderWrapper = ({
	children,
}: {
	children: ReactNode
}) => {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<IntlProvider>
				<QueryClientProvider client={queryClient}>
					{children}
				</QueryClientProvider>
			</IntlProvider>
		</ThemeProvider>
	)
}
