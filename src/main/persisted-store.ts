import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { writeFileSync as atomicWriteFileSync } from 'atomically'
import debug from 'debug'
import * as v from 'valibot'
import { persist, type PersistStorage } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

import { CoordinateFormatSchema } from '../shared/coordinate-format.ts'
import { LocaleSchema } from '../shared/intl.ts'

const log = debug('comapeo:main:persisted-store')

export const PersistedStateV1Schema = v.object({
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
	metricsDeviceId: v.optional(v.string(), () => generateMetricsDeviceId()),
})

export type PersistedStateV1 = v.InferOutput<typeof PersistedStateV1Schema>

export function createPersistedStore(opts: { filePath: string }) {
	function ensureDirectory() {
		mkdirSync(dirname(opts.filePath), { recursive: true })
	}

	const storage: PersistStorage<PersistedStateV1> = {
		getItem: () => {
			let content
			try {
				ensureDirectory()
				content = readFileSync(opts.filePath, { encoding: 'utf-8' })
			} catch {
				return null
			}

			return v.parse(
				v.object({
					version: v.optional(v.number()),
					state: PersistedStateV1Schema,
				}),
				JSON.parse(content),
			)
		},
		removeItem: () => {
			return rmSync(opts.filePath, { force: true })
		},
		setItem: (_name, value) => {
			ensureDirectory()

			const data =
				process.env.NODE_ENV === 'development'
					? JSON.stringify(value, null, 2)
					: JSON.stringify(value)

			try {
				atomicWriteFileSync(opts.filePath, data)
			} catch (err) {
				// NOTE: Accounts for potential issue with writing atomically on Windows
				// See https://github.com/sindresorhus/conf/blob/655f87c61bbf8240dfdedcd4fdf34a0457708b27/source/index.ts#L485-L487
				if (
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(err as any)?.code === 'EXDEV'
				) {
					writeFileSync(opts.filePath, data)
					return
				}

				throw err
			}
		},
	}

	const store = createStore(
		persist(
			(): PersistedStateV1 => {
				return v.getDefaults(PersistedStateV1Schema)
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

export type PersistedStore = ReturnType<typeof createPersistedStore>

function generateSentryUser(): { id: string; idMonth: string } {
	const id = randomBytes(16).toString('hex')
	const now = new Date()

	return { id, idMonth: `${now.getUTCFullYear()}-${now.getUTCMonth()}` }
}

function shouldRotateSentryUser(idMonth: string): boolean {
	const now = new Date()

	const currentIdMonth = `${now.getUTCFullYear()}-${now.getUTCMonth()}`

	return currentIdMonth !== idMonth
}

function generateMetricsDeviceId() {
	return randomBytes(16).toString('hex')
}
