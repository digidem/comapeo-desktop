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

	const mapServerApi = {
		async getBaseUrl() {
			const { localPort } =
				// @ts-expect-error Not worth patching IPC
				await appRpc.getMapServerPorts()

			return new URL(`http://127.0.0.1:${localPort}`)
		},
	}

	comapeoChannel.port1.start()
	appChannel.port1.start()

	return { clientApi, mapServerApi }
}
