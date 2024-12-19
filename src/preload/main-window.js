const { contextBridge, ipcRenderer } = require('electron/renderer')

window.onmessage = (event) => {
	// event.source === window means the message is coming from the preload
	// script, as opposed to from an <iframe> or other source.
	if (event.source !== window) return
	if (event.data !== 'comapeo-port') return
	const [port] = event.ports
	if (!port) return // TODO: throw/report error
	ipcRenderer.postMessage('comapeo-port', null, [port])
}

/**
 * @type {import('./runtime.js').RuntimeApi}
 */
const runtimeApi = {
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
