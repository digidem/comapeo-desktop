#!/usr/bin/env electron
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as path from 'node:path'
import debug from 'debug'
import { app } from 'electron/main'
import { parse } from 'valibot'

import { start } from './app.js'
import { createConfigStore } from './config-store.js'
import { getAppMode } from './utils.js'
import { AppConfigSchema } from './validation.js'

const require = createRequire(import.meta.url)

const log = debug('comapeo:main:index')

const appPath = app.getAppPath()

const appConfigFile = await readFile(
	path.join(appPath, 'app.config.json'),
	'utf-8',
)

const appConfig = parse(AppConfigSchema, JSON.parse(appConfigFile))

if (appConfig.asar === false) {
	process.noAsar = true
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
	app.quit()
}

const appMode = getAppMode()

// Set userData to alternative location if in development mode (to avoid conflicts/overriding production installation)
if (appMode === 'development') {
	const appPath = app.getAppPath()

	/** @type {string} */
	let userDataPath

	if (appConfig.userDataPath) {
		userDataPath = path.isAbsolute(appConfig.userDataPath)
			? path.resolve(appConfig.userDataPath)
			: path.resolve(appPath, appConfig.userDataPath)
	} else {
		userDataPath = path.join(appPath, 'data')
	}

	app.setPath('userData', userDataPath)
}

const configStore = createConfigStore()

start({
	appConfig,
	appMode,
	configStore,
})
	.then(() => {
		log('Paths', {
			app: app.getAppPath(),
			userData: app.getPath('userData'),
			logs: app.getPath('logs'),
		})
	})
	.catch((err) => {
		log(err)
	})
