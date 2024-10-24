import Store from 'electron-store'

/**
 * @typedef {Store<{locale: string, rootKey?: string}>} ConfigStore
 */

/**
 * @returns { ConfigStore }
 */
export function createConfigStore() {
	// @ts-expect-error Not sure how to get type inference from electron-store
	return new Store({
		schema: {
			locale: {
				type: 'string',
				default: 'en',
			},
			rootKey: {
				type: 'string',
			},
		},
	})
}
