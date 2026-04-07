import { createAppRpcClient, createMapeoClient } from '@comapeo/ipc/client.js'

export function initRpcClients() {
	const comapeoChannel = new MessageChannel()
	const appChannel = new MessageChannel()

	window.postMessage('comapeo-port', '*', [
		comapeoChannel.port2,
		appChannel.port2,
	])

	const clientApi = createMapeoClient(comapeoChannel.port1, {
		timeout: Infinity,
	})
	const appRpc = createAppRpcClient(appChannel.port1, { timeout: Infinity })

	// TODO: Consider hardcoded ports?
	const mapServerListenPromise = appRpc.mapServer.listen()

	const mapServerApi = {
		async getBaseUrl() {
			const { localPort } = await mapServerListenPromise

			return new URL(`http://127.0.0.1:${localPort}`)
		},
	}

	// NOTE: Prevent errors with starting the map server when Vite applies HMR update to this file (or consuming files)
	if (import.meta.hot) {
		import.meta.hot.on('vite:beforeUpdate', () => {
			appRpc.mapServer.close().catch((err) => {
				console.error(err)
			})
		})
	}

	// NOTE: Accounts for when page reloads occur in the app
	window.addEventListener('beforeunload', () => {
		appRpc.mapServer.close().catch((err) => {
			console.error(err)
		})
	})

	comapeoChannel.port1.start()
	appChannel.port1.start()

	return { clientApi, mapServerApi }
}
