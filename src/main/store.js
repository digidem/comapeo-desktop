import Store from 'electron-store'

import { getDevUserDataPath, isDevMode } from './utils.js'

export const store = /** @type {Store<{locale: string}>} */ (
	new Store({
		cwd: isDevMode() ? getDevUserDataPath() : undefined,
		schema: {
			locale: {
				type: 'string',
				default: 'en',
			},
		},
	})
)
