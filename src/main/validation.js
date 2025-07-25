import * as v from 'valibot'

export const AppEnvSchema = v.object({
	asar: v.optional(
		v.pipe(
			v.union([v.literal('true'), v.literal('false')]),
			v.transform((value) => {
				return value === 'true'
			}),
		),
	),
	onlineStyleUrl: v.pipe(v.string(), v.url()),
	userDataPath: v.optional(v.string()),
})

export const FilesSelectParamsSchema = v.union([
	v.object({ extensionFilters: v.optional(v.array(v.string())) }),
	v.undefined(),
])

export const PersistedLocaleSchema = v.variant('useSystemPreferences', [
	v.object({
		useSystemPreferences: v.literal(true),
		languageTag: v.null(),
	}),
	v.object({
		useSystemPreferences: v.literal(false),
		languageTag: v.string(),
	}),
])

export const PersistedCoordinateFormatSchema = v.union([
	v.literal('dd'),
	v.literal('dms'),
	v.literal('utm'),
])
