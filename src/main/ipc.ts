import { shell } from 'electron/common'
import { ipcMain } from 'electron/main'
import si from 'systeminformation'
import * as v from 'valibot'

import { type ConfigStore } from './config-store.js'
import { type Intl } from './intl.js'
import {
	PersistedCoordinateFormatSchema,
	PersistedLocaleSchema,
} from './validation.js'

export function setUpMainIPC({
	configStore,
	intl,
}: {
	configStore: ConfigStore
	intl: Intl
}) {
	// Shell
	ipcMain.handle('shell:open-external-url', (_event, url) => {
		v.assert(v.string(), url)
		return shell.openExternal(url)
	})

	// System
	ipcMain.handle('system:get:wifiConnections', () => {
		return si.wifiConnections()
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
		v.assert(v.union([v.string(), v.null()]), value)

		// We cannot use configStore.set() with `undefined` to "unset" a value in the store
		// since it is not JSON-serializable. Must use configStore.delete() instead.
		if (value === null) {
			return configStore.delete('activeProjectId')
		} else {
			return configStore.set('activeProjectId', value)
		}
	})

	ipcMain.handle('settings:set:coordinateFormat', (_event, value) => {
		v.assert(PersistedCoordinateFormatSchema, value)
		return configStore.set('coordinateFormat', value)
	})

	ipcMain.handle('settings:set:diagnosticsEnabled', (_event, value) => {
		v.assert(v.boolean(), value)
		return configStore.set('diagnosticsEnabled', value)
	})

	ipcMain.handle('settings:set:locale', (_event, value) => {
		v.assert(PersistedLocaleSchema, value)
		return intl.updateLocale(value)
	})
}
