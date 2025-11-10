import { shell } from 'electron/common'
import { ipcMain } from 'electron/main'
import si from 'systeminformation'
import * as v from 'valibot'

import type { IntlManager } from './intl-manager.ts'
import {
	PersistedStateV1Schema,
	type PersistedStore,
} from './persisted-store.ts'

export function setUpMainIPC({
	persistedStore,
	intlManager,
}: {
	persistedStore: PersistedStore
	intlManager: IntlManager
}) {
	// Shell
	ipcMain.handle('shell:open-external-url', (_event, url) => {
		v.assert(v.string(), url)
		return shell.openExternal(url)
	})

	ipcMain.handle('shell:show-item-in-folder', (_event, filePath) => {
		v.assert(v.string(), filePath)
		return shell.showItemInFolder(filePath)
	})

	// System
	ipcMain.handle('system:get:wifiConnections', () => {
		return si.wifiConnections()
	})

	// Settings (get)
	ipcMain.handle('settings:get:coordinateFormat', () => {
		return persistedStore.getState().coordinateFormat
	})

	ipcMain.handle('settings:get:diagnosticsEnabled', () => {
		return persistedStore.getState().diagnosticsEnabled
	})

	ipcMain.handle('settings:get:locale', () => {
		return intlManager.localeState
	})

	// Settings (set)
	ipcMain.handle('settings:set:coordinateFormat', (_event, value) => {
		v.assert(
			v.nonOptional(PersistedStateV1Schema.entries.coordinateFormat),
			value,
		)
		persistedStore.setState({ coordinateFormat: value })
	})

	ipcMain.handle('settings:set:diagnosticsEnabled', (_event, value) => {
		v.assert(
			v.nonOptional(PersistedStateV1Schema.entries.diagnosticsEnabled),
			value,
		)
		persistedStore.setState({ diagnosticsEnabled: value })
	})

	ipcMain.handle('settings:set:locale', (_event, value) => {
		v.assert(v.nonOptional(PersistedStateV1Schema.entries.locale), value)
		persistedStore.setState({ locale: value })
	})

	// Active project ID
	ipcMain.handle('activeProjectId:set', (_event, value) => {
		v.assert(
			v.union([
				v.nonOptional(PersistedStateV1Schema.entries.activeProjectId),
				v.null(),
			]),
			value,
		)

		persistedStore.setState({
			activeProjectId: value === null ? undefined : value,
		})
	})
}
