import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react'
import { createMapeoClient, MapeoClientApi } from '@mapeo/ipc'

const ApiContext = createContext<MapeoClientApi | null>(null)

export function ApiProvider({ children }: PropsWithChildren) {
  const [api, setApi] = useState<MapeoClientApi | null>(null)

  useEffect(() => {
    window.runtime.init()

    function onWindowMessage(event: MessageEvent) {
      // event.source === window means the message is coming from the preload
      // script, as opposed to from an <iframe> or other source.
      console.log('WINDOW EVENT', event)
      if (event.source === window && event.data === 'mapeo-port') {
        const [port] = event.ports

        // Shouldn't happen but maybe log error?
        if (!port) return

        const client = createMapeoClient(port, { timeout: Infinity })

        port.start()

        setApi(client)

        window.removeEventListener('message', onWindowMessage)
      }
    }

    window.addEventListener('message', onWindowMessage)

    return () => {
      window.removeEventListener('message', onWindowMessage)
    }
  }, [])

  if (!api) return null

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
}

export function useApi() {
  const api = useContext(ApiContext)

  if (!api) throw new Error('MapeoApiContext provider needs to be set up')

  return api
}
