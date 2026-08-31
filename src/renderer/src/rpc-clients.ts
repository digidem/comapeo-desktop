import {
	createComapeoCoreClient,
	createComapeoServicesClient,
} from '@comapeo/ipc/client.js'

export function createRpcClients() {
	const coreChannel = new MessageChannel()
	const appChannel = new MessageChannel()

	const coreClient = createComapeoCoreClient(coreChannel.port1, {
		timeout: Infinity,
	})
	const servicesClient = createComapeoServicesClient(appChannel.port1, {
		timeout: Infinity,
	})

	coreChannel.port1.start()
	appChannel.port1.start()

	return {
		coreClient,
		servicesClient,
		sendInitRequest: () => {
			window.postMessage('comapeo-port', '*', [
				coreChannel.port2,
				appChannel.port2,
			])
		},
	}
}
