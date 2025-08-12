import { randomBytes } from 'node:crypto'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineMessages } from '@formatjs/intl'
import debug from 'debug'
import {
	BrowserWindow,
	app,
	dialog,
	safeStorage,
	utilityProcess,
} from 'electron/main'
import * as v from 'valibot'

import { Intl } from './intl.js'
import { setUpMainIPC } from './ipc.js'
import { FilesSelectParamsSchema } from './validation.js'

const log = debug('comapeo:main:app')

/**
 * @import {UtilityProcess} from 'electron/main'
 * @import {ProcessArgs as CoreProcessArgs, NewClientMessage} from '../services/core.js'
 * @import {AppConfig} from '../shared/app.js'
 * @import {ConfigStore} from './config-store.js'
 */

/**
 * @private
 * @typedef {Object} Services
 * @property {UtilityProcess} core
 */

/**
 * @private
 * @typedef {Object} AppState
 * @property {boolean} tryingToQuitApp Used for distinguishing between closing a
 *   window explicitly and closing the application
 * @property {WeakMap<BrowserWindow, { type: 'main' | 'secondary' }>} browserWindows
 */

const _menuMessages = defineMessages({
	importConfig: {
		id: 'main.app.importConfig',
		defaultMessage: 'Import Config',
	},
})

const CORE_SERVICE_PATH = fileURLToPath(
	import.meta.resolve('../services/core.js'),
)

const MAIN_WINDOW_PRELOAD_PATH = fileURLToPath(
	new URL('../preload/main-window.js', import.meta.url),
)

/** @type {AppState} */
const APP_STATE = {
	tryingToQuitApp: false,
	browserWindows: new WeakMap(),
}

/**
 * @param {Object} opts
 * @param {AppConfig} opts.appConfig
 * @param {ConfigStore} opts.configStore
 *
 * @returns {Promise<void>}
 */
export async function start({ appConfig, configStore }) {
	// Quit when all windows are closed, except on macOS. There, it's common
	// for applications and their menu bar to stay active until the user quits
	// explicitly with Cmd + Q.
	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') {
			app.quit()
		}
	})

	app.on('before-quit', () => {
		APP_STATE.tryingToQuitApp = true
	})

	app.on('quit', () => {
		APP_STATE.tryingToQuitApp = false
	})

	const intl = setupIntl({ configStore })

	app.setAboutPanelOptions({ applicationVersion: appConfig.appVersion })

	setUpMainIPC({ configStore, intl })

	await app.whenReady()

	const rootKey = loadRootKey({ configStore })
	const services = setupServices({ appConfig, rootKey })

	const sentryUserId = configStore.get('sentryUser').id

	app.on('activate', () => {
		log('App activated')

		let existingMainWindow = null

		for (const bw of BrowserWindow.getAllWindows()) {
			const bwInfo = APP_STATE.browserWindows.get(bw)
			if (bwInfo?.type === 'main') {
				existingMainWindow = bw
				break
			}
		}

		if (existingMainWindow) {
			log(`Main window with id ${existingMainWindow.id} exists - showing`)
			existingMainWindow.show()
		} else {
			log('Main window does not exist - creating new main window')
			const mainWindow = initMainWindow({
				isDevelopment: appConfig.appType === 'development',
				appVersion: appConfig.appVersion,
				services,
				sentryUserId,
			})

			mainWindow.show()

			log(`Created main window with id ${mainWindow.id}`)
		}
	})

	const mainWindow = initMainWindow({
		appVersion: appConfig.appVersion,
		isDevelopment: appConfig.appType === 'development',
		sentryUserId,
		services,
	})
	mainWindow.show()

	log(`Created main window with id ${mainWindow.id}`)
}

/**
 * @param {Object} opts
 * @param {ConfigStore} opts.configStore
 *
 * @returns {Intl}
 */
function setupIntl({ configStore }) {
	const intl = new Intl({ configStore })

	return intl
}

/**
 * @param {Object} opts
 * @param {string} opts.appVersion
 * @param {boolean} opts.isDevelopment
 * @param {string} opts.sentryUserId
 * @param {Services} opts.services
 *
 * @returns {BrowserWindow} The main browser window
 */
function initMainWindow({ appVersion, isDevelopment, sentryUserId, services }) {
	const mainWindow = new BrowserWindow({
		width: 1200,
		minWidth: 800,
		height: 800,
		minHeight: 500,
		show: false,
		backgroundColor: '#050F77',
		webPreferences: {
			preload: MAIN_WINDOW_PRELOAD_PATH,
			additionalArguments: [
				`--comapeo-app-version=${appVersion}`,
				`--comapeo-sentry-user-id=${sentryUserId}`,
			],
		},
	})

	if (isDevelopment) {
		// TODO: Don't hard code ideally
		mainWindow.loadURL('http://localhost:5173/')
		mainWindow.webContents.openDevTools({
			mode: 'detach',
			activate: false,
		})
	} else {
		mainWindow.loadFile(
			fileURLToPath(new URL('../renderer/index.html', import.meta.url)),
		)
	}

	mainWindow.on('close', (event) => {
		if (!APP_STATE.tryingToQuitApp) {
			log(`Hiding main window with id ${mainWindow.id}`)
			event.preventDefault()
			mainWindow.hide()
			return
		}

		APP_STATE.browserWindows.delete(mainWindow)

		log(`Main window with id ${mainWindow.id} closed`)
	})

	// Set up communication channel between window and core service
	// https://www.electronjs.org/docs/latest/tutorial/message-ports/#messageports-in-the-main-process
	mainWindow.webContents.ipc.on('comapeo-port', (event) => {
		const [port] = event.ports
		if (!port) return // TODO: throw/report error
		services.core.postMessage(
			/** @satisfies {NewClientMessage} */
			{
				type: 'core:new-client',
				payload: { clientId: `window-${mainWindow.id}` },
			},
			[port],
		)
	})

	// Set up IPC specific to the main window
	mainWindow.webContents.ipc.handle('files:select', async (_event, params) => {
		v.assert(FilesSelectParamsSchema, params)

		const result = await dialog.showOpenDialog(mainWindow, {
			properties: ['openFile'],
			filters: params?.extensionFilters
				? [{ name: 'Custom file type', extensions: params.extensionFilters }]
				: undefined,
		})

		const selectedFilePath = result.filePaths[0]

		if (!selectedFilePath) return undefined

		return { name: basename(selectedFilePath), path: selectedFilePath }
	})

	APP_STATE.browserWindows.set(mainWindow, {
		type: 'main',
	})

	return mainWindow
}

/**
 * @param {Object} opts
 * @param {ConfigStore} opts.configStore
 *
 * @returns {string} Root key as hexidecimal string
 */
function loadRootKey({ configStore }) {
	const canEncrypt = safeStorage.isEncryptionAvailable()

	const storedRootKey = configStore.get('rootKey')

	if (!storedRootKey) {
		const rootKey = randomBytes(16).toString('hex')

		if (canEncrypt) {
			configStore.set(
				'rootKey',
				safeStorage.encryptString(rootKey).toString('hex'),
			)
		} else {
			configStore.set('rootKey', rootKey)
		}

		return rootKey
	}

	// TODO: Consumer needs to handle case when decryption fails?
	const rootKey = canEncrypt
		? safeStorage.decryptString(Buffer.from(storedRootKey, 'hex'))
		: storedRootKey

	return rootKey
}

/**
 * @param {Object} opts
 * @param {AppConfig} opts.appConfig
 * @param {string} opts.rootKey
 *
 * @returns {Services}
 */
function setupServices({ appConfig, rootKey }) {
	/** @satisfies {CoreProcessArgs} */
	const coreArgs = {
		onlineStyleUrl: appConfig.onlineStyleUrl,
		rootKey,
		storageDirectory: app.getPath('userData'),
	}

	const coreService = utilityProcess.fork(
		CORE_SERVICE_PATH,
		Object.entries(coreArgs).map(([flag, value]) => `--${flag}=${value}`),
		{ serviceName: `CoMapeo Core Service` },
	)

	return { core: coreService }
}
