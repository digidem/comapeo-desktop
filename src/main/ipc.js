import { shell } from 'electron'
import { ipcMain } from 'electron/main'
import * as v from 'valibot'

/**
 * @import {ConfigStore} from './config-store.js'
 * @import {Intl} from './intl.js'
 */

const FilesSelectParamsSchema = v.union([
	v.object({ extensionFilters: v.optional(v.array(v.string())) }),
	v.undefined(),
])

export const APP_IPC_EVENT_TO_PARAMS_PARSER = /** @type {const} */ ({
	/**
	 * @param {unknown} value
	 *
	 * @returns {import('valibot').InferOutput<typeof FilesSelectParamsSchema>}
	 */
	'files:select': (value) => {
		return v.parse(FilesSelectParamsSchema, value)
	},
})

/** @typedef {keyof typeof APP_IPC_EVENT_TO_PARAMS_PARSER} AppIPCEvents */

/**
 * @param {Object} opts
 * @param {ConfigStore} opts.configStore
 * @param {Intl} opts.intl
 */
export function setUpMainIPC({ configStore, intl }) {
	// Shell
	ipcMain.handle('shell:open-external-url', (_event, url) => {
		v.assert(v.string(), url)
		return shell.openExternal(url)
	})

	// Settings (get)
	ipcMain.handle('settings:get:activeProjectId', () => {
		return configStore.get('activeProjectId')
	})

	ipcMain.handle('settings:get:coordinateFormat', () => {
		return configStore.get('coordinateFormat')
	})

	ipcMain.handle('settings:get:diagnosticsEnabled', () => {
		return configStore.get('diagnosticsEnabled')
	})

	ipcMain.handle('settings:get:locale', () => {
		return intl.localeState
	})

	// Settings (set)
	ipcMain.handle('settings:set:activeProjectId', (_event, value) => {
		v.assert(v.string(), value)
		return configStore.set('activeProjectId', value)
	})

	ipcMain.handle('settings:set:coordinateFormat', (_event, value) => {
		v.assert(
			v.union([v.literal('dd'), v.literal('dms'), v.literal('utm')]),
			value,
		)
		return configStore.set('coordinateFormat', value)
	})

	ipcMain.handle('settings:set:diagnosticsEnabled', (_event, value) => {
		v.assert(v.boolean(), value)
		return configStore.set('diagnosticsEnabled', value)
	})

	ipcMain.handle('settings:set:locale', (_event, value) => {
		return intl.updateLocale(value)
	})
}
