const { contextBridge, ipcRenderer } = require('electron')

// We need to wait until the main world is ready to receive the message before
// sending the port. We create this promise in the preload so it's guaranteed
// to register the onload listener before the load event is fired.
const windowLoaded = new Promise((resolve) => {
	window.onload = resolve
})

/**
 * @type {import('./runtime.js').RuntimeApi}
 */
const runtimeApi = {
	// Setup
	init() {
		ipcRenderer.send('request-comapeo-port')
		ipcRenderer.once('provide-comapeo-port', async (event) => {
			await windowLoaded
			window.postMessage('comapeo-port', '*', event.ports)
		})
	},

	// Locale
	async getLocale() {
		const locale = await ipcRenderer.invoke('locale:get')
		if (typeof locale !== 'string') throw Error('Locale must be a string')
		return locale
	},
	updateLocale(locale) {
		ipcRenderer.send('locale:update', locale)
	},
}

contextBridge.exposeInMainWorld('runtime', runtimeApi)
