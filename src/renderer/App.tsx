import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Home } from './components/Home'
import { ApiProvider } from './contexts/ApiContext'
import { IntlProvider } from './contexts/IntlContext'

const queryClient = new QueryClient()

export function App() {
  return (
    <IntlProvider>
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <Home />
        </ApiProvider>
      </QueryClientProvider>
    </IntlProvider>
  )
}
