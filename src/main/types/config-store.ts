export type PersistedLocale =
	| {
			useSystemPreferences: true
			languageTag: null
	  }
	| {
			useSystemPreferences: false
			languageTag: string
	  }

export type PersistedCoordinateFormat = 'dd' | 'dms' | 'utm'

export type ConfigSchema = {
	activeProjectId: string | null
	coordinateFormat: PersistedCoordinateFormat
	diagnosticsEnabled: boolean
	locale: PersistedLocale
	rootKey: string | null
}
