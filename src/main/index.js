#!/usr/bin/env electron
import { createRequire } from 'node:module'
import { app } from 'electron'

import { start } from './app.js'
import { createConfigStore } from './config-store.js'
import { logger } from './logger.js'
import { getDevUserDataPath, isDevMode } from './utils.js'

const require = createRequire(import.meta.url)

const packageJson = require('../../package.json')

// @ts-expect-error Not worth trying to make TS happy
if (packageJson.asar === false) {
	process.noAsar = true
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
	app.quit()
}

if (isDevMode()) {
	// Set userData to alternative location if in development mode (to avoid conflicts/overriding production installation)
	app.setPath('userData', getDevUserDataPath())
}

const configStore = createConfigStore()

start({
	configStore,
})
	.then(() => {
		logger.info('Paths', {
			app: app.getAppPath(),
			userData: app.getPath('userData'),
			logs: app.getPath('logs'),
		})
	})
	.catch((err) => {
		logger.error(err)
	})
