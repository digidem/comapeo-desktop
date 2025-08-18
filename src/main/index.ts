#!/usr/bin/env electron
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { platform } from 'node:os'
import * as path from 'node:path'
import * as Sentry from '@sentry/electron/main'
import debug from 'debug'
import { app } from 'electron/main'
import { parse } from 'valibot'

import {
	AppConfigSchema,
	type AppConfig,
	type SentryEnvironment,
} from '../shared/app.js'
import { start } from './app.js'
import { createConfigStore } from './config-store.js'

const require = createRequire(import.meta.url)

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
	app.quit()
}

const log = debug('comapeo:main:index')

const appConfigFile = await readFile(
	path.join(app.getAppPath(), 'app.config.json'),
	'utf-8',
)

const appConfig: AppConfig = parse(AppConfigSchema, JSON.parse(appConfigFile))

// If desired, tell Electron to not use the ASAR format (https://www.electronjs.org/docs/latest/tutorial/asar-archives#treating-an-asar-archive-as-a-normal-file)
if (appConfig.asar === false) {
	process.noAsar = true
}

if (appConfig.appType === 'development') {
	// This is typically handled in the `readPackageJson` hook in the Forge configuration but that only runs when packaging an application.
	// This is still needed in the case of running the app through the development server.
	app.setName(`${app.name} Dev`)

	// Update some of the application paths used during development. This helps to avoid conflicts with production installations and helps debugging in some cases.
	//   - Sets the user data directory to `<root>/data/`, which can be overridden if `USER_DATA_PATH` is specified.
	//   - Sets the logs directory to `<root>/logs/` for macOS.
	const appPath = app.getAppPath()

	let userDataPath: string

	if (appConfig.userDataPath) {
		userDataPath = path.isAbsolute(appConfig.userDataPath)
			? path.resolve(appConfig.userDataPath)
			: path.resolve(appPath, appConfig.userDataPath)
	} else {
		userDataPath = path.join(appPath, 'data')
	}

	log(`Setting user data path to ${userDataPath}`)

	app.setPath('userData', userDataPath)

	// Logs are stored within the user data path on Windows and Linux, so no need to adjust it here.
	if (platform() === 'darwin') {
		const logsPath = path.join(appPath, 'logs')

		log(`Setting logs path to ${logsPath}`)

		app.setAppLogsPath(logsPath)
	}
}

// NOTE: Has to be set up after user data directory is updated
const configStore = createConfigStore()

const sentryUserId = configStore.get('sentryUser').id

let sentryEnvironment: SentryEnvironment = 'development'

if (appConfig.appType === 'release-candidate') {
	sentryEnvironment = 'qa'
} else if (appConfig.appType === 'production') {
	sentryEnvironment = 'production'
}

// NOTE: Has to be set up after user data directory is updated
// https://docs.sentry.io/platforms/javascript/guides/electron/#app-userdata-directory
Sentry.init({
	dsn: 'https://f7336c12cc39fb0367886e31036a6cd7@o4507148235702272.ingest.us.sentry.io/4509803831820288',
	// NOTE: Only works on app startup. Any changes to `diagnosticsEnabled` while the app is running will not
	// take effect here until the app is restarted.
	enabled: configStore.get('diagnosticsEnabled'),
	sendDefaultPii: false,
	// TODO: Enable tracing based on user consent in production
	tracesSampleRate: sentryEnvironment === 'production' ? 0 : 1.0,
	environment: sentryEnvironment,
	release: appConfig.appVersion,
	debug: sentryEnvironment === 'development',
	initialScope: { user: { id: sentryUserId } },
})

log('Paths', {
	app: app.getAppPath(),
	userData: app.getPath('userData'),
	logs: app.getPath('logs'),
})

start({ appConfig, configStore }).catch((err) => {
	Sentry.captureException(err)
	process.exit(1)
})
