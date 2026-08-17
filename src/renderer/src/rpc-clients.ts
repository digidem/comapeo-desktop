import {
	createComapeoCoreClient,
	createComapeoServicesClient,
} from '@comapeo/ipc/client.js'

export function initRpcClients() {
	const comapeoChannel = new MessageChannel()
	const appChannel = new MessageChannel()

	window.postMessage('comapeo-port', '*', [
		comapeoChannel.port2,
		appChannel.port2,
	])

	const coreClient = createComapeoCoreClient(comapeoChannel.port1, {
		timeout: Infinity,
	})
	const servicesClient = createComapeoServicesClient(appChannel.port1, {
		timeout: Infinity,
	})

	comapeoChannel.port1.start()
	appChannel.port1.start()

	return { coreClient, servicesClient }
}
