import { randomBytes } from 'node:crypto'
import { copyFile, mkdir, rm } from 'node:fs/promises'
import { basename, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineMessages } from '@formatjs/intl'
import { captureException } from '@sentry/electron'
import debug from 'debug'
import contextMenu from 'electron-context-menu'
import {
	BrowserWindow,
	app,
	dialog,
	safeStorage,
	utilityProcess,
	type UtilityProcess,
} from 'electron/main'
import * as v from 'valibot'

import type { NewClientMessage } from '../services/core.ts'
import type { AppConfig, AppType, SentryEnvironment } from '../shared/app.ts'
import {
	FilesSelectParamsSchema,
	ImportSMPFileParamsSchema,
} from '../shared/ipc.ts'
import { IntlManager } from './intl-manager.ts'
import { setUpMainIPC } from './ipc.ts'
import { createAppDiagnosticsMetricsScheduler } from './metrics/app-diagnostics-metrics.ts'
import type { PersistedStore } from './persisted-store.ts'
import { ServiceErrorMessageSchema } from './service-error.ts'

const log = debug('comapeo:main:app')

type AppState = {
	tryingToQuitApp: boolean
	browserWindows: WeakMap<BrowserWindow, { type: 'main' | 'secondary' }>
}

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
	persistedStore,
}: {
	appConfig: AppConfig
	persistedStore: PersistedStore
}): Promise<void> {
	app.setAboutPanelOptions({ applicationVersion: appConfig.appVersion })

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

	const intlManager = new IntlManager({
		initialLocale: persistedStore.getState().locale,
	})

	persistedStore.subscribe((current, previous) => {
		if (previous.locale !== current.locale) {
			intlManager.updateLocale(current.locale)
		}
	})

	setUpMainIPC({ persistedStore, intlManager })

	let disposeAppContextMenu = createAppContextMenu({
		appType: appConfig.appType,
		intlManager,
	})

	intlManager.on('locale-state', () => {
		disposeAppContextMenu()

		disposeAppContextMenu = createAppContextMenu({
			appType: appConfig.appType,
			intlManager,
		})
	})

	const comapeoUserDataDirectory = join(app.getPath('userData'), 'comapeo')

	const metricsDirectory = join(comapeoUserDataDirectory, 'metrics')

	await mkdir(metricsDirectory, { recursive: true })

	const appDiagnosticsMetrics = createAppDiagnosticsMetricsScheduler({
		appConfig,
		getLocaleInfo: () => {
			return {
				appLocale: intlManager.localeState.value,
				deviceLocale: app.getPreferredSystemLanguages()[0]!,
			}
		},
		getMetricsDeviceId: () => {
			return persistedStore.getState().metricsDeviceId
		},
		storageFilePath: join(metricsDirectory, 'app-diagnostics.json'),
	})

	if (persistedStore.getState().diagnosticsEnabled) {
		log('Enabling app diagnostics metrics')
		appDiagnosticsMetrics.setEnabled(true)
	}

	persistedStore.subscribe((current, previous) => {
		if (previous.diagnosticsEnabled !== current.diagnosticsEnabled) {
			log(
				`${current.diagnosticsEnabled ? 'Enabling' : 'Disabling'} app diagnostics metrics`,
			)
			appDiagnosticsMetrics.setEnabled(current.diagnosticsEnabled)
		}
	})

	await app.whenReady()

	const rootKey = loadRootKey({ persistedStore })

	const coreProcessArgs = [
		`--rootKey=${rootKey}`,
		`--storageDirectory=${comapeoUserDataDirectory}`,
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

	const persisted = persistedStore.getState()
	const sentryUserId = persisted.sentryUser.id
	const diagnosticsEnabled = persisted.diagnosticsEnabled

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
				comapeoUserDataDirectory,
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
		comapeoUserDataDirectory,
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

function initMainWindow({
	appVersion,
	coreService,
	comapeoUserDataDirectory,
	isDevelopment,
	sentryConfig,
}: {
	appVersion: string
	coreService: UtilityProcess
	comapeoUserDataDirectory: string
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
		if (process.platform === 'darwin' && !APP_STATE.tryingToQuitApp) {
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

	// NOTE: Must match what's set up in core service (see `CUSTOM_MAPS_DIR_NAME` variable)
	const customMapsDirectory = join(comapeoUserDataDirectory, 'maps')

	mainWindow.webContents.ipc.handle(
		'files:import_smp_file',
		async (_event, params) => {
			v.assert(ImportSMPFileParamsSchema, params)

			if (!isAbsolute(params.filePath)) {
				throw new Error('file path must be an absolute path')
			}

			await copyFile(params.filePath, join(customMapsDirectory, 'default.smp'))
		},
	)

	mainWindow.webContents.ipc.handle('files:remove_smp_file', async () => {
		await rm(join(customMapsDirectory, 'default.smp'), { force: true })
	})

	APP_STATE.browserWindows.set(mainWindow, { type: 'main' })

	return mainWindow
}

/**
 * @returns Root key as hexidecimal string
 */
function loadRootKey({ persistedStore }: { persistedStore: PersistedStore }) {
	const canEncrypt = safeStorage.isEncryptionAvailable()

	const storedRootKey = persistedStore.getState().rootKey

	if (!storedRootKey) {
		const rootKey = randomBytes(16).toString('hex')

		if (canEncrypt) {
			persistedStore.setState({
				rootKey: safeStorage.encryptString(rootKey).toString('hex'),
			})
		} else {
			persistedStore.setState({ rootKey })
		}

		return rootKey
	}

	// TODO: Consumer needs to handle case when decryption fails?
	const rootKey = canEncrypt
		? safeStorage.decryptString(Buffer.from(storedRootKey, 'hex'))
		: storedRootKey

	return rootKey
}

const messages = defineMessages({
	contextMenuCopy: {
		id: 'main.app.contextMenuCopy',
		defaultMessage: 'Copy',
		description: 'Context menu item label for copying text',
	},
	contextMenuCopyImage: {
		id: 'main.app.contextMenuCopyImage',
		defaultMessage: 'Copy Image',
		description: 'Context menu item label for copying an image',
	},
	contextMenuCopyImageAddress: {
		id: 'main.app.contextMenuCopyImageAddress',
		defaultMessage: 'Copy Image Address',
		description: 'Context menu item label for copying the URL of an image',
	},
	contextMenuCopyLink: {
		id: 'main.app.contextMenuCopyLink',
		defaultMessage: 'Copy Link',
		description: 'Context menu item label for copying a link',
	},
	contextMenuCut: {
		id: 'main.app.contextMenuCut',
		defaultMessage: 'Cut',
		description: 'Context menu item label for cutting text',
	},
	contextMenuInspectElement: {
		id: 'main.app.contextMenuInspectElement',
		defaultMessage: 'Inspect',
		description: 'Context menu item label for inspecting an element',
	},
	contextMenuLearnSpelling: {
		id: 'main.app.contextMenuLearnSpelling',
		defaultMessage: 'Learn Spelling {placeholder}',
		description:
			'Context menu item label for learning the spelling of the selected text',
	},
	contextMenuLookUpSelection: {
		id: 'main.app.contextMenuLookUpSelection',
		defaultMessage: 'Look up {placeholder}',
		description: 'Context menu item label for looking up selected text',
	},
	contextMenuPaste: {
		id: 'main.app.contextMenuPaste',
		defaultMessage: 'Paste',
		description: 'Context menu item label for paste',
	},
	contextMenuSaveImageAs: {
		id: 'main.app.contextMenuSaveImageAs',
		defaultMessage: 'Save Image As…',
		description: 'Context menu item label for saving an image as…',
	},
	contextMenuSelectAll: {
		id: 'main.app.contextMenuSelectAll',
		defaultMessage: 'Select All',
		description: 'Context menu item label for selecting all',
	},
})

function createAppContextMenu({
	appType,
	intlManager,
}: {
	appType: AppType
	intlManager: IntlManager
}) {
	return contextMenu({
		showCopyImage: true,
		showCopyImageAddress: true,
		showCopyLink: true,
		showInspectElement: appType !== 'production',
		showLearnSpelling: true,
		showSaveImage: false,
		showSaveImageAs: true,
		showSearchWithGoogle: false,
		labels: {
			copy: intlManager.formatMessage(messages.contextMenuCopy),
			copyImage: intlManager.formatMessage(messages.contextMenuCopyImage),
			copyImageAddress: intlManager.formatMessage(
				messages.contextMenuCopyImageAddress,
			),
			copyLink: intlManager.formatMessage(messages.contextMenuCopyLink),
			cut: intlManager.formatMessage(messages.contextMenuCut),
			inspect: intlManager.formatMessage(messages.contextMenuInspectElement),
			learnSpelling: intlManager.formatMessage(
				messages.contextMenuLearnSpelling,
				{
					// NOTE: Kind of awkward but need `{selection}` to be literally inlined for the replacement to work
					// https://github.com/sindresorhus/electron-context-menu#labels
					placeholder: '"{selection}"',
				},
			),
			lookUpSelection: intlManager.formatMessage(
				messages.contextMenuLookUpSelection,
				{
					// NOTE: Kind of awkward but need `{selection}` to be literally inlined for the replacement to work
					// https://github.com/sindresorhus/electron-context-menu#labels
					placeholder: '"{selection}"',
				},
			),
			paste: intlManager.formatMessage(messages.contextMenuPaste),
			saveImageAs: intlManager.formatMessage(messages.contextMenuSaveImageAs),
			selectAll: intlManager.formatMessage(messages.contextMenuSelectAll),
		},
	})
}
