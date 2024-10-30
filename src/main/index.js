#!/usr/bin/env electron
import { createRequire } from 'node:module'
import * as path from 'node:path'
import debug from 'debug'
import { app } from 'electron/main'

import { start } from './app.js'
import { createConfigStore } from './config-store.js'
import { getAppMode } from './utils.js'

const require = createRequire(import.meta.url)

const packageJson = require('../../package.json')

const log = debug('comapeo:main:index')

// @ts-expect-error Not worth trying to make TS happy
if (packageJson.asar === false) {
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

	if (process.env.USER_DATA_PATH) {
		userDataPath = path.isAbsolute(process.env.USER_DATA_PATH)
			? path.resolve(process.env.USER_DATA_PATH)
			: path.resolve(appPath, process.env.USER_DATA_PATH)
	} else {
		userDataPath = path.resolve(appPath, 'data')
	}

	app.setPath('userData', userDataPath)
}

const configStore = createConfigStore()

start({
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
