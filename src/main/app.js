import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { defineMessages } from '@formatjs/intl'
import {
	app,
	BrowserWindow,
	ipcMain,
	MessageChannelMain,
	utilityProcess,
} from 'electron'

import { getSystemLocale, intl } from './intl.js'
import { logger } from './logger.js'
import { getDevUserDataPath, isDevMode } from './utils.js'

/**
 * @import { ProcessArgs as CoreProcessArgs, NewClientMessage } from './service/core.js'
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

function setupIpc() {
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

function setupIntl() {
	let locale = intl.load()

	if (!locale) {
		locale = getSystemLocale()
		logger.info('Using system locale', locale)
		intl.updateLocale(locale)
	}
}

/**
 * @param {BrowserWindow} window
 */
function setupServices(window) {
	// TODO: Gotta store this key using safeStorage?
	const rootKey = process.env.ROOT_KEY
		? Buffer.from(process.env.ROOT_KEY, 'hex')
		: randomBytes(16).toString('hex')

	/** @type {CoreProcessArgs} */
	const flags = {
		rootKey: rootKey.toString('hex'),
		storageDirectory: app.getPath('userData'),
	}

	const mapeoCoreService = utilityProcess.fork(
		CORE_SERVICE_PATH,
		Object.entries(flags).map(([flag, value]) => `--${flag}=${value}`),
		{ serviceName: `Mapeo Core Utility Process` },
	)

	/** @type {NewClientMessage} */
	const newClientMessage = {
		type: 'core:new-client',
		payload: { clientId: `window-${Date.now()}` },
	}

	// We can't use ipcMain.handle() here, because the reply needs to transfer a MessagePort.
	window.webContents.ipc.on('request-comapeo-port', (event) => {
		const { port1, port2 } = new MessageChannelMain()
		mapeoCoreService.postMessage(newClientMessage, [port1])
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

export async function start() {
	// Set userData to alternative location if in development mode (to avoid conflicts/overriding production installation)
	if (isDevMode()) {
		app.setPath('userData', getDevUserDataPath())
	}

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

	setupIntl()
	setupIpc()

	await app.whenReady()

	const mainWindow = createMainWindow()

	setupServices(mainWindow)
}
