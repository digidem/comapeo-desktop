import { useEffect, useState, type PropsWithChildren } from 'react'
import { ClientApiProvider } from '@comapeo/core-react'
import { createMapeoClient, type MapeoClientApi } from '@comapeo/ipc'

export function ApiProvider({ children }: PropsWithChildren) {
	const [api, setApi] = useState<MapeoClientApi | null>(null)

	useEffect(() => {
		window.runtime.init()

		function onWindowMessage(event: MessageEvent) {
			// event.source === window means the message is coming from the preload
			// script, as opposed to from an <iframe> or other source.
			console.log('WINDOW EVENT', event)
			if (event.source === window && event.data === 'comapeo-port') {
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

	return <ClientApiProvider clientApi={api}>{children}</ClientApiProvider>
}
