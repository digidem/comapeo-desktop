import { shell } from 'electron/common'
import { ipcMain } from 'electron/main'
import si from 'systeminformation'
import * as v from 'valibot'

import type { AppUsageMetrics } from '../shared/metrics.ts'
import type { IntlManager } from './intl-manager.ts'
import {
	CurrentStoreStateSchema,
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

	ipcMain.handle('settings:get:appUsageMetrics', () => {
		return persistedStore.getState().appUsageMetrics
	})

	// Settings (set)
	ipcMain.handle('settings:set:coordinateFormat', (_event, value) => {
		v.assert(
			v.nonOptional(CurrentStoreStateSchema.entries.coordinateFormat),
			value,
		)
		persistedStore.setState({ coordinateFormat: value })
	})

	ipcMain.handle('settings:set:diagnosticsEnabled', (_event, value) => {
		v.assert(
			v.nonOptional(CurrentStoreStateSchema.entries.diagnosticsEnabled),
			value,
		)
		persistedStore.setState({ diagnosticsEnabled: value })
	})

	ipcMain.handle('settings:set:locale', (_event, value) => {
		v.assert(v.nonOptional(CurrentStoreStateSchema.entries.locale), value)
		persistedStore.setState({ locale: value })
	})

	ipcMain.handle('settings:set:appUsageMetrics', (_event, value) => {
		v.assert(v.union([v.literal('disabled'), v.literal('enabled')]), value)

		persistedStore.setState((prev) => {
			const now = Date.now()

			if (!prev.appUsageMetrics) {
				const updatedAppUsageMetrics: AppUsageMetrics =
					value === 'disabled'
						? { status: value, askCount: 0, updatedAt: now }
						: { status: value, updatedAt: now }

				return { appUsageMetrics: updatedAppUsageMetrics }
			}

			if (prev.appUsageMetrics.status === 'disabled') {
				const updatedAppUsageMetrics: AppUsageMetrics =
					value === 'disabled'
						? {
								...prev.appUsageMetrics,
								askCount: prev.appUsageMetrics.askCount + 1,
								updatedAt: now,
							}
						: { status: value, updatedAt: now }

				return { appUsageMetrics: updatedAppUsageMetrics }
			} else {
				const updatedAppUsageMetrics: AppUsageMetrics =
					value === 'disabled'
						? { status: value, askCount: 0, updatedAt: now }
						: // TODO: Would it make more sense to no-op here instead of updating `updatedAt`?
							{ ...prev.appUsageMetrics, updatedAt: now }

				return { appUsageMetrics: updatedAppUsageMetrics }
			}
		})
	})

	// User
	ipcMain.handle('user:activeProjectId:set', (_event, value) => {
		v.assert(
			v.union([
				v.nonOptional(CurrentStoreStateSchema.entries.activeProjectId),
				v.null(),
			]),
			value,
		)

		persistedStore.setState({
			activeProjectId: value === null ? undefined : value,
		})
	})

	ipcMain.handle('user:onboardedAt:get', () => {
		return persistedStore.getState().onboardedAt
	})

	ipcMain.handle('user:onboardedAt:set', (_event, value) => {
		v.assert(v.nonOptional(CurrentStoreStateSchema.entries.onboardedAt), value)

		const existingValue = persistedStore.getState().onboardedAt

		if (existingValue !== undefined) {
			throw new Error('`onboardedAt` is already recorded')
		}

		persistedStore.setState({ onboardedAt: value })
	})
}
