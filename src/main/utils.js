import path from 'node:path'
import { app } from 'electron'
import isDev from 'electron-is-dev'

export function isDevMode() {
	return isDev
}

// We use a local directory in development to avoid issues if the production app is already installed
export function getDevUserDataPath() {
	if (!isDevMode()) throw new Error('Should only be called in dev mode')

	const appPath = app.getAppPath()

	if (!process.env.USER_DATA_PATH) {
		return path.resolve(appPath, 'data')
	}

	return path.isAbsolute(process.env.USER_DATA_PATH)
		? path.resolve(process.env.USER_DATA_PATH)
		: path.resolve(appPath, process.env.USER_DATA_PATH)
}
