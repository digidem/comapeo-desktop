import Store from 'electron-store'

/**
 * @typedef {Object} ConfigSchema
 * @property {string | null} activeProjectId
 * @property {boolean} diagnosticsEnabled
 * @property {string} locale
 * @property {string | null} rootKey
 */

/**
 * @typedef {Omit<ConfigSchema, 'rootKey'>} EditableAppSettings
 */

/** @typedef {ReturnType<typeof createConfigStore>} ConfigStore */

export function createConfigStore() {
	const store = /**
	 * @type {Store<ConfigSchema>}
	 */ (
		new Store({
			schema: {
				activeProjectId: {
					type: ['string', 'null'],
					default: null,
				},
				diagnosticsEnabled: {
					type: 'boolean',
					default: true,
				},
				locale: {
					type: 'string',
					default: 'en',
				},
				rootKey: {
					type: ['string', 'null'],
					default: null,
				},
			},
		})
	)

	return store
}
