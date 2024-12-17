import { ThemeProvider } from '@emotion/react'
import { CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { App } from './App'
import { theme } from './Theme'
import { ApiProvider } from './contexts/ApiContext'
import { IntlProvider } from './contexts/IntlContext'
import {
	PersistedProjectIdProvider,
	createProjectIdStore,
} from './contexts/persistedState/PersistedProjectId'

const queryClient = new QueryClient()
const PersistedProjectIdStore = createProjectIdStore({ isPersisted: true })
export const AppWrapper = () => {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<IntlProvider>
				<QueryClientProvider client={queryClient}>
					<ApiProvider>
						<PersistedProjectIdProvider store={PersistedProjectIdStore}>
							<App />
						</PersistedProjectIdProvider>
					</ApiProvider>
				</QueryClientProvider>
			</IntlProvider>
		</ThemeProvider>
	)
}
