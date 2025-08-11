export type SentryEnvironment = 'development' | 'qa' | 'production'

export type AppType =
	| 'development'
	| 'internal'
	| 'release-candidate'
	| 'production'

export type AppConfig = {
	/** Enables ASAR format */
	asar?: boolean
	/** Sets the online map style for @comapeo/core to use */
	onlineStyleUrl: string
	/** Sets the user data directory for the application to use */
	userDataPath?: string
	/** Indicates the app type */
	appType: AppType
	/** Indicates the app version */
	appVersion: string
}
