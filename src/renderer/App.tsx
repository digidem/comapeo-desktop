import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Home } from './components/Home'
import { ApiProvider } from './contexts/ApiContext'
import { IntlProvider } from './contexts/IntlContext'
import { theme } from './Theme'

const queryClient = new QueryClient()

export function App() {
  return (
    <IntlProvider>
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Home />
          </ThemeProvider>
        </ApiProvider>
      </QueryClientProvider>
    </IntlProvider>
  )
}
