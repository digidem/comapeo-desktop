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
		/** @type {unknown} */
		const result = await ipcRenderer.invoke('files:select', {
			extensionFilters,
		})

		if (!result) return undefined

		validateSelectedFileResult(result)

		return result
	},
}

/**
 * @param {NonNullable<unknown>} value
 *
 * @returns {asserts value is import('./runtime.js').SelectedFile}
 */
function validateSelectedFileResult(value) {
	if (!('path' in value && 'name' in value)) {
		throw new Error('Value has invalid shape')
	}

	if (typeof value.path !== 'string') {
		throw new Error('Value has invalid path field')
	}

	if (typeof value.name !== 'string') {
		throw new Error('Value has invalid name field')
	}
}

contextBridge.exposeInMainWorld('runtime', runtimeApi)
