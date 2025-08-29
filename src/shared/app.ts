import * as v from 'valibot'

export type SentryEnvironment = 'development' | 'qa' | 'production'

export type AppType =
	| 'development'
	| 'internal'
	| 'release-candidate'
	| 'production'

export const AppConfigSchema = v.object({
	/** Enables ASAR format */
	asar: v.optional(v.boolean()),
	/** Sets the online map style for @comapeo/core to use */
	onlineStyleUrl: v.optional(v.pipe(v.string(), v.url())),
	/** Sets the user data directory for the application to use */
	userDataPath: v.optional(v.string()),
	/** Indicates the app type */
	appType: v.union([
		v.literal('development'),
		v.literal('internal'),
		v.literal('release-candidate'),
		v.literal('production'),
	]),
	/** Indicates the app version */
	appVersion: v.string(),
})

export type AppConfig = v.InferOutput<typeof AppConfigSchema>
