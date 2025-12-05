import type { Systeminformation } from 'systeminformation'

import type { CoordinateFormat } from '#shared/coordinate-format.ts'
import type { Locale, LocaleState } from '#shared/intl.ts'
import type { SelectedFile } from '#shared/ipc.ts'

export type RuntimeApi = {
	// Files
	selectFile: (opts?: {
		actionLabel?: string
		extensionFilters?: Array<string>
	}) => Promise<SelectedFile | undefined>
	selectDirectory: (opts?: {
		actionLabel?: string
	}) => Promise<SelectedFile | undefined>
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
	downloadURL: (params: { url: string; saveAs: boolean }) => Promise<void>
	openExternalURL: (url: string) => Promise<void>
	showItemInFolder: (path: string) => Promise<void>

	// Settings (get)
	getCoordinateFormat: () => Promise<CoordinateFormat>
	getDiagnosticsEnabled: () => Promise<boolean>
	getLocaleState: () => Promise<LocaleState>

	// Settings (set)
	setCoordinateFormat: (value: CoordinateFormat) => Promise<void>
	setDiagnosticsEnabled: (value: boolean) => Promise<void>
	setLocale: (value: Locale) => Promise<void>

	// Sentry
	getSentryConfig: () => {
		enabled: boolean
		environment: string
		userId: string
	}

	// Active Project ID
	getInitialProjectId: () => string | undefined
	setActiveProjectId: (value: string | undefined) => Promise<void>
}
