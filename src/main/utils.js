import isDev from 'electron-is-dev'
import * as v from 'valibot'

import { AppEnvSchema } from './validation.js'

/**
 * @typedef {v.InferOutput<typeof AppEnvSchema>} AppEnv
 */

/**
 * @returns {AppEnv}
 */
export function getAppEnv() {
	return v.parse(AppEnvSchema, {
		asar: process.env.ASAR,
		onlineStyleUrl: process.env.ONLINE_STYLE_URL,
		userDataPath: process.env.USER_DATA_PATH,
	})
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
