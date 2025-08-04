#!/usr/bin/env electron
import { createRequire } from 'node:module'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import debug from 'debug'
import dotenv from 'dotenv'
import { app } from 'electron/main'

import { start } from './app.js'
import { createConfigStore } from './config-store.js'
import { getAppEnv, getAppMode } from './utils.js'

const require = createRequire(import.meta.url)

const log = debug('comapeo:main:index')

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) })

const appEnv = getAppEnv()

if (appEnv.asar === false) {
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

	if (appEnv.userDataPath) {
		userDataPath = path.isAbsolute(appEnv.userDataPath)
			? path.resolve(appEnv.userDataPath)
			: path.resolve(appPath, appEnv.userDataPath)
	} else {
		userDataPath = path.join(appPath, 'data')
	}

	app.setPath('userData', userDataPath)
}

const configStore = createConfigStore()

start({
	appEnv,
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
