#!/usr/bin/env electron
import { createRequire } from 'node:module'
import { app } from 'electron'

import { start } from './app'
import { logger } from './logger'

const require = createRequire(import.meta.url)

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

start().catch((err) => {
  logger.error(err)
})
