import path from 'node:path'
import { defineMessages } from '@formatjs/intl'
import {
  app,
  BrowserWindow,
  ipcMain,
  MessageChannelMain,
  utilityProcess,
} from 'electron'

import type {
  ProcessArgs as CoreProcessArgs,
  NewClientMessage,
} from '../service/core.ts'
import { getSystemLocale, intl } from './intl'
import { logger } from './logger'
import { CORE_SERVICE_PATH, MAIN_WINDOW_RENDERER_PATH } from './paths.ts'
import { getDevUserDataPath, isDevMode } from './utils'

const _menuMessages = defineMessages({
  importConfig: {
    id: 'main.app.importConfig',
    defaultMessage: 'Import Config',
  },
})

function setupIpc() {
  ipcMain.handle('locale:get', (_event) => {
    logger.debug('Locale is', intl.locale)
    return intl.locale
  })

  ipcMain.handle('locale:update', (_event, locale: string) => {
    logger.debug('Updating locale to', locale)
    intl.updateLocale(locale)
  })
}

function setupIntl() {
  let locale = intl.load()

  if (!locale) {
    locale = getSystemLocale()
    logger.info('Using system locale', locale)
    intl.updateLocale(locale)
  }
}

function setupServices(window: BrowserWindow) {
  // TODO: Gotta store this key using safeStorage?
  const rootKey = Buffer.from(import.meta.env.VITE_ROOT_KEY, 'hex')

  const flags: CoreProcessArgs = {
    rootKey: rootKey.toString('hex'),
    storageDirectory: app.getPath('userData'),
  }

  const mapeoCoreService = utilityProcess.fork(
    CORE_SERVICE_PATH,
    Object.entries(flags).map(([flag, value]) => `--${flag}=${value}`),
    { serviceName: `Mapeo Core Utility Process` },
  )

  const newClientMessage: NewClientMessage = {
    type: 'core:new-client',
    payload: { clientId: `window-${Date.now()}` },
  }

  // We can't use ipcMain.handle() here, because the reply needs to transfer a MessagePort.
  window.webContents.ipc.on('request-mapeo-port', (event) => {
    const { port1, port2 } = new MessageChannelMain()
    mapeoCoreService.postMessage(newClientMessage, [port1])
    event.senderFrame.postMessage('provide-mapeo-port', null, [port2])
  })
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(import.meta.dirname, '../preload/main-window.js'),
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(MAIN_WINDOW_RENDERER_PATH)
  }

  mainWindow.webContents.openDevTools()

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
