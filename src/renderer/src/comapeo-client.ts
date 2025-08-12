import { createMapeoClient } from '@comapeo/ipc/client.js'

export function initComapeoClient() {
	const { port1, port2 } = new MessageChannel()
	window.postMessage('comapeo-port', '*', [port2])
	const client = createMapeoClient(port1, { timeout: Infinity })
	port1.start()
	return client
}
