import type {
	PersistedCoordinateFormat,
	PersistedLocale,
} from '../main/types/config-store.js'
import type { LocaleState } from '../main/types/intl.js'

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
	getAppInfo: () => { appVersion: string; systemVersion: string }

	// Shell
	openExternalURL: (url: string) => Promise<void>

	// Settings (get)
	getActiveProjectId: () => Promise<string | null>
	getCoordinateFormat: () => Promise<PersistedCoordinateFormat>
	getDiagnosticsEnabled: () => Promise<boolean>
	getLocaleState: () => Promise<LocaleState>

	// Settings (set)
	setActiveProjectId: (value: string | null) => Promise<void>
	setCoordinateFormat: (value: PersistedCoordinateFormat) => Promise<void>
	setDiagnosticsEnabled: (value: boolean) => Promise<void>
	setLocale: (value: PersistedLocale) => Promise<void>
}
