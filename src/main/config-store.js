import Store from 'electron-store'

/** @typedef {ReturnType<typeof createConfigStore>} ConfigStore */

export function createConfigStore() {
	const store = /**
	 * @type {Store<{
	 * 	locale: string
	 * 	rootKey?: string
	 * 	diagnosticsEnabled: boolean
	 * }>}
	 */ (
		new Store({
			schema: {
				locale: {
					type: 'string',
					default: 'en',
				},
				rootKey: {
					type: 'string',
				},
				diagnosticsEnabled: {
					type: 'boolean',
					default: true,
				},
			},
		})
	)

	return store
}
