import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { theme } from './Theme'
import { ApiProvider } from './contexts/ApiContext'
import { IntlProvider } from './contexts/IntlContext'
import { Home } from './pages/Home'

const queryClient = new QueryClient()

export function App() {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<IntlProvider>
				<QueryClientProvider client={queryClient}>
					<ApiProvider>
						<Home />
					</ApiProvider>
				</QueryClientProvider>
			</IntlProvider>
		</ThemeProvider>
	)
}
