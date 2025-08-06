import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import isDev from 'electron-is-dev'
import { app } from 'electron/main'
import * as v from 'valibot'

import { AppConfigSchema } from './validation.js'

/**
 * @typedef {v.InferOutput<typeof AppConfigSchema>} AppConfig
 */

/**
 * @returns {Promise<AppConfig>}
 */
export async function getAppConfig() {
	const appPath = app.getAppPath()

	const appConfigFile = await readFile(
		join(appPath, 'app.config.json'),
		'utf-8',
	)

	return v.parse(AppConfigSchema, JSON.parse(appConfigFile))
}

/**
 * @typedef {'development' | 'production'} AppMode
 */

/**
 * @returns {AppMode}
 */
export function getAppMode() {
	return isDev ? 'development' : 'production'
}
