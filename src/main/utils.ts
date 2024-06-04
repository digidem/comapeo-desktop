import path from 'node:path'
import { app } from 'electron'

export function isDevMode() {
  return import.meta.env.DEV
}

export function getUserDataPath() {
  if (!isDevMode()) return app.getPath('userData')

  // We use a local directory in development to avoid issues if the production app is already installed
  if (process.env.USER_DATA_DIR) {
    return path.isAbsolute(process.env.USER_DATA_DIR)
      ? path.resolve(process.env.USER_DATA_DIR)
      : path.resolve(import.meta.dirname, '../../', process.env.USER_DATA_DIR)
  } else {
    return path.resolve(import.meta.dirname, '../../data')
  }
}
