import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { defineMessages } from '@formatjs/intl'
import {
	app,
	BrowserWindow,
	ipcMain,
	MessageChannelMain,
	safeStorage,
	utilityProcess,
} from 'electron'

import { getSystemLocale, Intl } from './intl.js'
import { logger } from './logger.js'
import { isDevMode } from './utils.js'

/**
 * @import { ProcessArgs as CoreProcessArgs, NewClientMessage } from './service/core.js'
 * @import { ConfigStore } from './config-store.js'
 */

const _menuMessages = defineMessages({
	importConfig: {
		id: 'main.app.importConfig',
		defaultMessage: 'Import Config',
	},
})

const CORE_SERVICE_PATH = fileURLToPath(
	import.meta.resolve('./service/core.js'),
)

const MAIN_WINDOW_PRELOAD_PATH = fileURLToPath(
	new URL('../preload/main-window.js', import.meta.url),
)

/**
 * @param {Object} opts
 * @param {ConfigStore} opts.configStore
 *
 * @returns {Promise<void>}
 */
export async function start({ configStore }) {
	// Quit when all windows are closed, except on macOS. There, it's common
	// for applications and their menu bar to stay active until the user quits
	// explicitly with Cmd + Q.
	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') {
			app.quit()
		}
	})

	app.on('activate', () => {
		// On OS X it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) {
			createMainWindow()
		}
	})

	const intl = setupIntl({ configStore })

	setupIpc({ intl })

	await app.whenReady()

	const mainWindow = createMainWindow()

	const rootKey = loadRootKey({ configStore })

	setupServices({ rootKey, window: mainWindow })
}

/**
 * @param {Object} opts
 * @param {ConfigStore} opts.configStore
 *
 * @returns {Intl}
 */
function setupIntl({ configStore }) {
	const intl = new Intl({
		configStore,
	})

	let locale = intl.load()

	if (!locale) {
		locale = getSystemLocale()
		logger.info('Using system locale', locale)
		intl.updateLocale(locale)
	}

	return intl
}

/**
 * @param {Object} opts
 * @param {Intl} opts.intl
 */
function setupIpc({ intl }) {
	ipcMain.handle('locale:get', (_event) => {
		logger.debug('Locale is', intl.locale)
		return intl.locale
	})

	ipcMain.handle(
		'locale:update',
		/**
		 * @param {*} _event
		 * @param {string} locale
		 */
		(_event, locale) => {
			logger.debug('Updating locale to', locale)
			intl.updateLocale(locale)
		},
	)
}

/**
 * @param {Object} opts
 * @param {string} opts.rootKey
 * @param {BrowserWindow} opts.window
 */
function setupServices({ rootKey, window }) {
	/** @type {CoreProcessArgs} */
	const flags = {
		rootKey,
		storageDirectory: app.getPath('userData'),
	}

	const coreService = utilityProcess.fork(
		CORE_SERVICE_PATH,
		Object.entries(flags).map(([flag, value]) => `--${flag}=${value}`),
		{ serviceName: `CoMapeo Core Utility Process` },
	)

	/** @type {NewClientMessage} */
	const newClientMessage = {
		type: 'core:new-client',
		payload: { clientId: `window-${Date.now()}` },
	}

	// We can't use ipcMain.handle() here, because the reply needs to transfer a MessagePort.
	window.webContents.ipc.on('request-comapeo-port', (event) => {
		const { port1, port2 } = new MessageChannelMain()
		coreService.postMessage(newClientMessage, [port1])
		event.senderFrame.postMessage('provide-comapeo-port', null, [port2])
	})
}

function createMainWindow() {
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: { preload: MAIN_WINDOW_PRELOAD_PATH },
	})

	if (isDevMode()) {
		// TODO: Don't hard code ideally
		mainWindow.loadURL('http://localhost:5173/')
		mainWindow.webContents.openDevTools()
	} else {
		mainWindow.loadFile(
			fileURLToPath(new URL('../renderer/index.html', import.meta.url)),
		)
	}

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
