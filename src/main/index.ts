#!/usr/bin/env electron

import path from 'node:path'
import { app } from 'electron'

import { start } from './app'
import { logger } from './logger'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

// We set the userData path to a local directory in development to avoid issues if the production app is already installed
if (import.meta.env.DEV) {
  let devUserDataPath: string

  if (process.env.USER_DATA_DIR) {
    devUserDataPath = path.isAbsolute(process.env.USER_DATA_DIR)
      ? path.resolve(process.env.USER_DATA_DIR)
      : path.resolve(__dirname, '../../', process.env.USER_DATA_DIR)
  } else {
    devUserDataPath = path.resolve(__dirname, '../../data')
  }

  app.setPath('userData', devUserDataPath)
}

;(async () => {
  try {
    await start()
  } catch (err) {
    logger.error(err)
  }
})()
