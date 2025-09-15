import type { Systeminformation } from 'systeminformation'

import type { CoordinateFormat } from '../shared/coordinate-format.ts'
import type { Locale, LocaleState } from '../shared/intl.ts'
import type { SelectedFile } from '../shared/ipc.ts'

export type RuntimeApi = {
	// Files
	selectFile: (
		extensionFilters?: Array<string>,
	) => Promise<SelectedFile | undefined>
	importSMPFile: (filePath: string) => Promise<void>
	removeSMPFile: () => Promise<void>

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
	getCoordinateFormat: () => Promise<CoordinateFormat>
	getDiagnosticsEnabled: () => Promise<boolean>
	getLocaleState: () => Promise<LocaleState>

	// Settings (set)
	setActiveProjectId: (value: string | null) => Promise<void>
	setCoordinateFormat: (value: CoordinateFormat) => Promise<void>
	setDiagnosticsEnabled: (value: boolean) => Promise<void>
	setLocale: (value: Locale) => Promise<void>

	// Sentry
	getSentryConfig: () => {
		enabled: boolean
		environment: string
		userId: string
	}
}
