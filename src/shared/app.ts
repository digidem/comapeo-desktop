import * as v from 'valibot'

export type SentryEnvironment = 'development' | 'qa' | 'production'

export type AppType =
	| 'development'
	| 'internal'
	| 'release-candidate'
	| 'production'

export const AppConfigSchema = v.object({
	/** Indicates the app type */
	appType: v.union([
		v.literal('development'),
		v.literal('internal'),
		v.literal('release-candidate'),
		v.literal('production'),
	]),
	/** Indicates the app version */
	appVersion: v.string(),
	/** Enables ASAR format */
	asar: v.optional(v.boolean()),
	/** Metrics configuration */
	metrics: v.object({
		/**
		 * Access token used for authorization.
		 */
		accessToken: v.optional(v.string()),
		/**
		 * URL to send diagnostics metrics to.
		 */
		diagnosticsUrl: v.optional(v.pipe(v.string(), v.url())),
	}),
	/** Sets the online map style for @comapeo/core to use */
	onlineStyleUrl: v.optional(v.pipe(v.string(), v.url())),
	/** [Sentry DSN](https://docs.sentry.io/concepts/key-terms/dsn-explainer/) */
	sentryDsn: v.optional(v.pipe(v.string(), v.url())),
	/** Sets the user data directory for the application to use */
	userDataPath: v.optional(v.string()),
	/**
	 * Windows-only. Indicates the Application User Model ID:
	 * https://learn.microsoft.com/en-us/windows/win32/shell/appids
	 */
	win32AppUserModelId: v.optional(v.string()),
})

export type AppConfig = v.InferOutput<typeof AppConfigSchema>
