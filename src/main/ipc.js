import { shell } from 'electron/common'
import { ipcMain } from 'electron/main'
import si from 'systeminformation'
import * as v from 'valibot'

import { PersistedV1Schema } from './persisted-store.js'

/**
 * @import {PersistedStore} from './persisted-store.js'
 * @import {Intl} from './intl.js'
 */

/**
 * @param {Object} opts
 * @param {PersistedStore} opts.persistedStore
 * @param {Intl} opts.intl
 */
export function setUpMainIPC({ persistedStore, intl }) {
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
		return persistedStore.getState().activeProjectId
	})

	ipcMain.handle('settings:get:coordinateFormat', () => {
		return persistedStore.getState().coordinateFormat
	})

	ipcMain.handle('settings:get:diagnosticsEnabled', () => {
		return persistedStore.getState().diagnosticsEnabled
	})

	ipcMain.handle('settings:get:locale', () => {
		return intl.localeState
	})

	// Settings (set)
	ipcMain.handle('settings:set:activeProjectId', (_event, value) => {
		v.assert(
			v.union([
				v.nonOptional(PersistedV1Schema.entries.activeProjectId),
				v.null(),
			]),
			value,
		)

		persistedStore.setState({
			activeProjectId: value === null ? undefined : value,
		})
	})

	ipcMain.handle('settings:set:coordinateFormat', (_event, value) => {
		v.assert(v.nonOptional(PersistedV1Schema.entries.coordinateFormat), value)
		persistedStore.setState({ coordinateFormat: value })
	})

	ipcMain.handle('settings:set:diagnosticsEnabled', (_event, value) => {
		v.assert(v.nonOptional(PersistedV1Schema.entries.diagnosticsEnabled), value)
		persistedStore.setState({ diagnosticsEnabled: value })
	})

	ipcMain.handle('settings:set:locale', (_event, value) => {
		v.assert(v.nonOptional(PersistedV1Schema.entries.locale), value)
		persistedStore.setState({ locale: value })
	})
}
