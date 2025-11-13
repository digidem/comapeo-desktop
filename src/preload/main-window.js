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
	async selectFile(opts) {
		/** @type {unknown} */
		const result = await ipcRenderer.invoke('files:select_file', opts)

		if (!result) return undefined

		validateSelectedFileResult(result)

		return result
	},
	async selectDirectory(opts) {
		/** @type {unknown} */
		const result = await ipcRenderer.invoke('files:select_directory', opts)

		if (!result) return undefined

		validateSelectedFileResult(result)

		return result
	},
	async importSMPFile(filePath) {
		return ipcRenderer.invoke('files:import_smp_file', { filePath })
	},
	async removeSMPFile() {
		return ipcRenderer.invoke('files:remove_smp_file')
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
	downloadURL: async (params) => {
		await ipcRenderer.invoke('shell:download-url', params)
	},
	openExternalURL: async (url) => {
		return ipcRenderer.invoke('shell:open-external-url', url)
	},
	showItemInFolder: async (filePath) => {
		return ipcRenderer.invoke('shell:show-item-in-folder', filePath)
	},

	// Settings (get)
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

	// Active project ID
	getInitialProjectId: () => {
		const sessionValue = sessionStorage.getItem('comapeo:active_project_id')

		// NOTE: Some entry in session storage, use that as the source of truth.
		// This accounts for race conditions that can happen due to the async nature of updating the active project ID in config storage.
		// e.g. manual page refresh right after leaving a project
		if (typeof sessionValue === 'string') {
			return sessionValue.length > 0 ? sessionValue : undefined
		}

		// NOTE: No entry in session storage, get initial value from process arg.
		const processArgValue = getProcessArgValue('comapeo-initial-project-id')

		if (processArgValue === 'undefined') {
			return undefined
		}

		return processArgValue
	},
	setActiveProjectId: async (value) => {
		return ipcRenderer.invoke('activeProjectId:set', value || null)
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
 * @returns {asserts value is import('../shared/ipc.ts').SelectedFile}
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
