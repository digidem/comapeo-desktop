import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClient } from 'rpc-reflector'

import type { MapeoCoreApi } from '../shared'
import { Home } from './components/Home'
import { IntlProvider } from './contexts/IntlProvider'

const queryClient = new QueryClient()

export function App() {
  const status = useInit()
  if (status !== 'ready') return null
  return (
    <IntlProvider>
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    </IntlProvider>
  )
}

function useInit() {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    window.runtime.init()

    window.onmessage = async (event) => {
      // event.source === window means the message is coming from the preload
      // script, as opposed to from an <iframe> or other source.
      if (event.source === window && event.data === 'mapeo-port') {
        const [port] = event.ports

        // Shouldn't happen but maybe log error?
        if (!port) return

        window.mapeo = createClient<MapeoCoreApi>(port)

        port.start()

        window.mapeo.on('update', (obs) => {
          console.log('observations updated:', JSON.stringify(obs))
        })

        setStatus('ready')
      }
    }
  }, [])

  return status
}
