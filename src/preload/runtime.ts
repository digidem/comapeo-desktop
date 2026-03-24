import type { Systeminformation } from 'systeminformation'

import type { CoordinateFormat } from '../shared/coordinate-format.ts'
import type { Locale, LocaleState } from '../shared/intl.ts'
import type { SelectedFile } from '../shared/ipc.ts'
import type { AppUsageMetrics } from '../shared/metrics.ts'

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

	// Settings
	getCoordinateFormat: () => Promise<CoordinateFormat>
	setCoordinateFormat: (value: CoordinateFormat) => Promise<void>

	getDiagnosticsEnabled: () => Promise<boolean>
	setDiagnosticsEnabled: (value: boolean) => Promise<void>

	getLocaleState: () => Promise<LocaleState>
	setLocale: (value: Locale) => Promise<void>

	getAppUsageMetrics: () => Promise<AppUsageMetrics | null>
	setAppUsageMetrics: (value: AppUsageMetrics['status']) => Promise<void>

	// User
	getSentryConfig: () => {
		enabled: boolean
		environment: string
		userId: string
	}

	getInitialProjectId: () => string | undefined
	setActiveProjectId: (value: string | undefined) => Promise<void>

	getOnboardedAt: () => Promise<number | null>
	setOnboardedAt: (value: number) => Promise<void>
}
