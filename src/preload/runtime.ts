import type { Systeminformation } from 'systeminformation'

import type { PersistedState } from '../main/persisted-store.js'
import type { LocaleState } from '../shared/intl.js'

export type SelectedFile = {
	name: string
	path: string
}

export type RuntimeApi = {
	// Files
	selectFile: (
		extensionFilters?: Array<string>,
	) => Promise<SelectedFile | undefined>

	// System
	getAppInfo: () => {
		appVersion: string
		systemVersion: string
		platform: NodeJS.Platform
	}
	getWifiConnections: () => Promise<Array<Systeminformation.WifiConnectionData>>

	// Shell
	openExternalURL: (url: string) => Promise<void>

	// Settings (get)
	getActiveProjectId: () => Promise<string | undefined>
	getCoordinateFormat: () => Promise<PersistedState['coordinateFormat']>
	getDiagnosticsEnabled: () => Promise<boolean>
	getLocaleState: () => Promise<LocaleState>

	// Settings (set)
	setActiveProjectId: (value: string | null) => Promise<void>
	setCoordinateFormat: (
		value: PersistedState['coordinateFormat'],
	) => Promise<void>
	setDiagnosticsEnabled: (value: boolean) => Promise<void>
	setLocale: (value: PersistedState['locale']) => Promise<void>

	// Sentry
	getSentryConfig: () => {
		enabled: boolean
		environment: string
		userId: string
	}
}
