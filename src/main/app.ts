import { randomBytes } from 'node:crypto'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineMessages } from '@formatjs/intl'
import { captureException } from '@sentry/electron'
import debug from 'debug'
import {
	BrowserWindow,
	app,
	dialog,
	safeStorage,
	utilityProcess,
	type UtilityProcess,
} from 'electron/main'
import * as v from 'valibot'

import type { NewClientMessage } from '../services/core.js'
import type { AppConfig, SentryEnvironment } from '../shared/app.js'
import type { ConfigStore } from './config-store.js'
import { Intl } from './intl.js'
import { setUpMainIPC } from './ipc.js'
import {
	FilesSelectParamsSchema,
	ServiceErrorMessageSchema,
} from './validation.js'

const log = debug('comapeo:main:app')

/**
 * @import {UtilityProcess} from 'electron'
 * @import {NewClientMessage} from '../services/core.js'
 * @import {AppConfig, SentryEnvironment} from '../shared/app.js'
 * @import {ConfigStore} from './config-store.js'
 */

type AppState = {
	tryingToQuitApp: boolean
	browserWindows: WeakMap<BrowserWindow, { type: 'main' | 'secondary' }>
}

const _menuMessages = defineMessages({
	importConfig: {
		id: 'main.app.importConfig',
		defaultMessage: 'Import Config',
	},
})

const CORE_SERVICE_PATH = fileURLToPath(
	import.meta.resolve('../services/core.ts'),
)

const MAIN_WINDOW_PRELOAD_PATH = fileURLToPath(
	new URL('../preload/main-window.js', import.meta.url),
)

const APP_STATE: AppState = {
	tryingToQuitApp: false,
	browserWindows: new WeakMap(),
}

export async function start({
	appConfig,
	configStore,
}: {
	appConfig: AppConfig
	configStore: ConfigStore
}): Promise<void> {
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

	const coreProcessArgs = [
		`--rootKey=${rootKey}`,
		`--storageDirectory=${app.getPath('userData')}`,
	]

	if (appConfig.onlineStyleUrl) {
		coreProcessArgs.push(`--onlineStyleUrl=${appConfig.onlineStyleUrl}`)
	}

	const coreService = utilityProcess.fork(CORE_SERVICE_PATH, coreProcessArgs, {
		serviceName: `CoMapeo Core Service`,
	})

	coreService.on('message', (message) => {
		if (v.is(ServiceErrorMessageSchema, message)) {
			captureException(message.error)
			return
		}
	})

	app.on('quit', () => {
		if (coreService.pid) {
			coreService.kill()
		}
	})

	const sentryUserId = configStore.get('sentryUser').id
	const diagnosticsEnabled = configStore.get('diagnosticsEnabled')

	/** @type {SentryEnvironment} */
	let sentryEnvironment: SentryEnvironment = 'development'

	if (appConfig.appType === 'release-candidate') {
		sentryEnvironment = 'qa'
	} else if (appConfig.appType === 'production') {
		sentryEnvironment = 'production'
	}

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
				appVersion: appConfig.appVersion,
				coreService,
				isDevelopment: appConfig.appType === 'development',
				sentryConfig: {
					enabled: diagnosticsEnabled,
					environment: sentryEnvironment,
					userId: sentryUserId,
				},
			})

			mainWindow.show()

			log(`Created main window with id ${mainWindow.id}`)
		}
	})

	const mainWindow = initMainWindow({
		appVersion: appConfig.appVersion,
		coreService,
		isDevelopment: appConfig.appType === 'development',
		sentryConfig: {
			enabled: diagnosticsEnabled,
			environment: sentryEnvironment,
			userId: sentryUserId,
		},
	})

	log(`Created main window with id ${mainWindow.id}`)

	mainWindow.addListener('ready-to-show', () => {
		mainWindow.show()
	})
}

/**
 * @param {Object} opts
 * @param {ConfigStore} opts.configStore
 *
 * @returns {Intl}
 */
function setupIntl({ configStore }: { configStore: ConfigStore }): Intl {
	const intl = new Intl({ configStore })

	return intl
}

function initMainWindow({
	appVersion,
	coreService,
	isDevelopment,
	sentryConfig,
}: {
	appVersion: string
	coreService: UtilityProcess
	isDevelopment: boolean
	sentryConfig: {
		enabled: boolean
		environment: SentryEnvironment
		userId: string
	}
}): BrowserWindow {
	const mainWindow = new BrowserWindow({
		width: 1200,
		minWidth: 800,
		height: 800,
		minHeight: 500,
		// NOTE: Needs to be explicitly set for Linux
		// https://www.electronforge.io/guides/create-and-add-icons#linux
		icon:
			process.platform === 'linux'
				? join(app.getAppPath(), 'assets', 'icon.png')
				: undefined,
		show: false,
		backgroundColor: '#050F77',
		titleBarStyle: 'hiddenInset',
		titleBarOverlay: true,
		webPreferences: {
			preload: MAIN_WINDOW_PRELOAD_PATH,
			additionalArguments: [
				`--comapeo-app-version=${appVersion}`,
				`--comapeo-sentry-user-id=${sentryConfig.userId}`,
				`--comapeo-sentry-enabled=${sentryConfig.enabled}`,
				`--comapeo-sentry-environment=${sentryConfig.environment}`,
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
		coreService.postMessage(
			{
				type: 'main:new-client',
				payload: { clientId: `window-${mainWindow.id}` },
			} satisfies NewClientMessage,
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

	APP_STATE.browserWindows.set(mainWindow, { type: 'main' })

	return mainWindow
}

function loadRootKey({ configStore }: { configStore: ConfigStore }): string {
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
