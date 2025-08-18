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

	// System
	getAppInfo: () => {
		const appVersion = getProcessArgValue('comapeo-app-version')
		const systemVersion = process.getSystemVersion()

		return { appVersion, systemVersion, platform: process.platform }
	},
	getWifiConnections: async () => {
		return ipcRenderer.invoke('system:get:wifiConnections')
	},

	// Shell
	openExternalURL: async (url) => {
		return ipcRenderer.invoke('shell:open-external-url', url)
	},

	// Settings (get)
	getActiveProjectId: async () => {
		return ipcRenderer.invoke('settings:get:activeProjectId')
	},
	getCoordinateFormat: async () => {
		return ipcRenderer.invoke('settings:get:coordinateFormat')
	},
	getDiagnosticsEnabled: async () => {
		return ipcRenderer.invoke('settings:get:diagnosticsEnabled')
	},
	getLocaleState: async () => {
		return ipcRenderer.invoke('settings:get:locale')
	},

	// Settings (set)
	setActiveProjectId: async (value) => {
		return ipcRenderer.invoke('settings:set:activeProjectId', value)
	},
	setCoordinateFormat: async (value) => {
		return ipcRenderer.invoke('settings:set:coordinateFormat', value)
	},
	setDiagnosticsEnabled: async (value) => {
		return ipcRenderer.invoke('settings:set:diagnosticsEnabled', value)
	},
	setLocale: async (value) => {
		return ipcRenderer.invoke('settings:set:locale', value)
	},

	// Sentry
	getSentryConfig: () => {
		const enabled = getProcessArgValue('comapeo-sentry-enabled') === 'true'
		const environment = getProcessArgValue('comapeo-sentry-environment')
		const userId = getProcessArgValue('comapeo-sentry-user-id')

		return { enabled, environment, userId }
	},
}

/**
 * @param {`comapeo-${string}`} flag
 *
 * @returns {string}
 */
function getProcessArgValue(flag) {
	const match = process.argv
		// TODO: Kind of fragile but works for now
		.find((a) => a.startsWith(`--${flag}=`))

	if (!match) {
		throw new Error(`Missing process argument '${flag}'`)
	}

	const value = match.split('=')?.[1]

	if (!value) {
		throw new Error(`Could not get value for flag '${flag}'`)
	}

	return value
}

/**
 * @param {NonNullable<unknown>} value
 *
 * @returns {asserts value is import('../shared/ipc.js').SelectedFile}
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
