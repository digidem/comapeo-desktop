import { randomBytes } from 'node:crypto'
import debug from 'debug'
import Store from 'electron-store'

const log = debug('comapeo:main:config-store')

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
				sentryUser: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
						},
						idMonth: {
							type: 'string',
						},
					},
					required: ['id', 'idMonth'],
					default: generateSentryUser(),
				},
			},
		})
	)

	const sentryUser = store.get('sentryUser')

	// NOTE: The retrieved value may be the default based on config store schema,
	// which is not immediately persisted upon initialization.
	// We want to make sure that this value is persisted upon startup, even if it might be
	// rotated shortly after.
	store.set('sentryUser', sentryUser)

	if (shouldRotateSentryUser(sentryUser.idMonth)) {
		log('Rotating Sentry user')
		const newSentryUser = generateSentryUser()
		store.set('sentryUser', newSentryUser)
	}

	return store
}

/**
 * @returns {ConfigStore['store']['sentryUser']}
 */
export function generateSentryUser() {
	const id = randomBytes(16).toString('hex')
	const now = new Date()

	return { id, idMonth: `${now.getUTCFullYear()}-${now.getUTCMonth()}` }
}

/**
 * @param {ConfigStore['store']['sentryUser']['idMonth']} idMonth
 *
 * @returns {boolean}
 */
export function shouldRotateSentryUser(idMonth) {
	const now = new Date()

	const currentIdMonth = `${now.getUTCFullYear()}-${now.getUTCMonth()}`

	return currentIdMonth !== idMonth
}
