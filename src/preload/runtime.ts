import type { Systeminformation } from 'systeminformation'

import type {
	PersistedCoordinateFormat,
	PersistedLocale,
} from '../main/types/config-store.js'
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
	getCoordinateFormat: () => Promise<PersistedCoordinateFormat>
	getDiagnosticsEnabled: () => Promise<boolean>
	getLocaleState: () => Promise<LocaleState>

	// Settings (set)
	setActiveProjectId: (value: string | null) => Promise<void>
	setCoordinateFormat: (value: PersistedCoordinateFormat) => Promise<void>
	setDiagnosticsEnabled: (value: boolean) => Promise<void>
	setLocale: (value: PersistedLocale) => Promise<void>

	// Sentry
	getSentryConfig: () => {
		enabled: boolean
		environment: string
		userId: string
	}
}
