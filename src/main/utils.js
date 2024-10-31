import isDev from 'electron-is-dev'
import * as v from 'valibot'

const AppEnvSchema = v.object({
	asar: v.optional(
		v.pipe(
			v.union([v.literal('true'), v.literal('false')]),
			v.transform((value) => {
				return value === 'true'
			}),
		),
	),
	onlineStyleUrl: v.pipe(v.string(), v.url()),
	userDataPath: v.optional(v.string()),
})

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
