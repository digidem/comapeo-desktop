import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import debug from 'debug'
import * as v from 'valibot'
import { persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

import { CoordinateFormatSchema, LocaleSchema } from './validation.js'

const log = debug('comapeo:main:persisted-store')

export const PersistedV1Schema = v.object({
	activeProjectId: v.optional(v.string()),
	coordinateFormat: v.optional(CoordinateFormatSchema, 'utm'),
	diagnosticsEnabled: v.optional(v.boolean(), true),
	locale: v.optional(LocaleSchema, {
		languageTag: null,
		useSystemPreferences: true,
	}),
	rootKey: v.optional(v.string()),
	sentryUser: v.optional(
		v.object({
			id: v.string(),
			idMonth: v.string(),
		}),
		() => generateSentryUser(),
	),
})

/**
 * @typedef {v.InferOutput<typeof PersistedV1Schema>} PersistedStateV1
 */

/**
 * @param {Object} opts
 * @param {string} opts.filePath
 */
export function createPersistedStore(opts) {
	function ensureDirectory() {
		mkdirSync(dirname(opts.filePath), { recursive: true })
	}

	// TODO: Use https://github.com/fabiospampinato/atomically
	/** @type {import('zustand/middleware').PersistStorage<PersistedStateV1>} */
	const storage = {
		getItem: () => {
			let content
			try {
				ensureDirectory()
				content = readFileSync(opts.filePath, { encoding: 'utf-8' })
			} catch {
				return null
			}

			return v.parse(
				v.object({ version: v.optional(v.number()), state: PersistedV1Schema }),
				JSON.parse(content),
			)
		},
		removeItem: () => {
			return rmSync(opts.filePath, { force: true })
		},
		setItem: (_name, value) => {
			ensureDirectory()

			writeFileSync(
				opts.filePath,
				process.env.NODE_ENV === 'development'
					? JSON.stringify(value, null, 2)
					: JSON.stringify(value),
			)
		},
	}

	const store = createStore(
		persist(
			/**
			 * @returns {v.InferOutput<typeof PersistedV1Schema>}
			 */
			() => {
				return v.getDefaults(PersistedV1Schema)
			},
			{
				name: 'comapeo-persisted',
				version: 1,
				storage,
			},
		),
	)

	const state = store.getState()

	// NOTE: The state may be the initial state due to a lack of persisted state,
	// which is not immediately persisted upon initialization.
	// We want to make sure that this value is persisted upon startup.
	store.setState((prev) => prev)

	if (shouldRotateSentryUser(state.sentryUser.idMonth)) {
		log('Rotating Sentry user')
		const newSentryUser = generateSentryUser()
		store.setState({ sentryUser: newSentryUser })
	}

	return store
}

/**
 * @typedef {ReturnType<typeof createPersistedStore>} PersistedStore
 */

function generateSentryUser() {
	const id = randomBytes(16).toString('hex')
	const now = new Date()

	return { id, idMonth: `${now.getUTCFullYear()}-${now.getUTCMonth()}` }
}

/**
 * @param {string} idMonth
 *
 * @returns {boolean}
 */
export function shouldRotateSentryUser(idMonth) {
	const now = new Date()

	const currentIdMonth = `${now.getUTCFullYear()}-${now.getUTCMonth()}`

	return currentIdMonth !== idMonth
}
