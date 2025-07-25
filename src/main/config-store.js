import Store from 'electron-store'

/** @typedef {ReturnType<typeof createConfigStore>} ConfigStore */

export function createConfigStore() {
	const store = /**
	 * @type {Store<import('./types/config-store.js').ConfigSchema>}
	 */ (
		new Store({
			schema: {
				activeProjectId: {
					type: ['string'],
				},
				coordinateFormat: {
					type: ['string'],
					enum: ['dd', 'dms', 'utm'],
					default: 'utm',
				},
				diagnosticsEnabled: {
					type: 'boolean',
					default: true,
				},
				locale: {
					type: 'object',
					oneOf: [
						{
							type: 'object',
							properties: {
								useSystemPreferences: {
									type: 'boolean',
									const: true,
								},
								languageTag: {
									type: 'null',
								},
							},
							required: ['useSystemPreferences', 'languageTag'],
						},
						{
							type: 'object',
							properties: {
								useSystemPreferences: {
									type: 'boolean',
									const: false,
								},
								languageTag: {
									type: 'string',
									minLength: 2,
								},
							},
							required: ['useSystemPreferences', 'languageTag'],
						},
					],
					default: {
						useSystemPreferences: true,
						languageTag: null,
					},
				},
				rootKey: {
					type: ['string'],
				},
			},
		})
	)

	return store
}
