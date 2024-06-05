#!/usr/bin/env electron
import { createRequire } from 'node:module'
import { app } from 'electron'

import { start } from './app'
import { logger } from './logger'
import { getUserDataPath } from './utils'

const require = createRequire(import.meta.url)

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

app.setPath('userData', getUserDataPath())

start().catch((err) => {
  logger.error(err)
})
