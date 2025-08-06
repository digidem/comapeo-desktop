import isDev from 'electron-is-dev'

/**
 * @typedef {'development' | 'production'} AppMode
 */

/**
 * @returns {AppMode}
 */
export function getAppMode() {
	return isDev ? 'development' : 'production'
}
