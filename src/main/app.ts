import path from 'node:path'
import { defineMessages } from '@formatjs/intl'
import {
  app,
  BrowserWindow,
  ipcMain,
  MessageChannelMain,
  utilityProcess,
} from 'electron'

import { getSystemLocale, intl } from './intl'
import { logger } from './logger'
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
  // mapeo core background process
  const mapeoCoreService = utilityProcess.fork(
    path.resolve(import.meta.dirname, '../service/mapeo-core.js'),
  )

  // We can't use ipcMain.handle() here, because the reply needs to transfer a
  // MessagePort.
  // Listen for message sent from the top-level frame
  window.webContents.ipc.on('request-mapeo-port', (event) => {
    // Create a new channel ...
    const { port1, port2 } = new MessageChannelMain()
    // ... send one end to the worker ...
    mapeoCoreService.postMessage({ message: 'new-client' }, [port1])
    // ... and the other end to the main window.
    event.senderFrame.postMessage('provide-mapeo-port', null, [port2])
    // Now the main window and the worker can communicate with each other
    // without going through the main process!
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
    mainWindow.loadFile(
      path.join(
        import.meta.dirname,
        `../../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`,
      ),
    )
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
