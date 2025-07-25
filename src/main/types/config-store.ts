import { type InferOutput } from 'valibot'

import { PersistedLocaleSchema } from '../validation.js'

export type PersistedLocale = InferOutput<typeof PersistedLocaleSchema>

export type PersistedCoordinateFormat = 'dd' | 'dms' | 'utm'

export type ConfigSchema = {
	activeProjectId?: string
	coordinateFormat: PersistedCoordinateFormat
	diagnosticsEnabled: boolean
	locale: PersistedLocale
	rootKey?: string
}
