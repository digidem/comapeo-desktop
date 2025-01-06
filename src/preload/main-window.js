const { contextBridge, ipcRenderer } = require('electron/renderer')

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
		if (typeof locale !== 'string') {
			throw new Error('Locale must be a string')
		}
		return locale
	},
	updateLocale(locale) {
		ipcRenderer.send('locale:update', locale)
	},

	// Files
	async selectFile(extensionFilters) {
		const filePath = await ipcRenderer.invoke('files:select', {
			extensionFilters,
		})

		if (!(typeof filePath === 'string' || typeof filePath === 'undefined')) {
			throw new Error(`File path is unexpected type: ${typeof filePath}`)
		}

		return filePath
	},
}

contextBridge.exposeInMainWorld('runtime', runtimeApi)
