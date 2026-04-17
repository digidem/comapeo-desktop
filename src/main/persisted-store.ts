import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { writeFileSync as atomicWriteFileSync } from 'atomically'
import debug from 'debug'
import * as v from 'valibot'
import { persist, type PersistStorage } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

import { CoordinateFormatSchema } from '../shared/coordinate-format.ts'
import { LocaleSchema, type SupportedLanguageTag } from '../shared/intl.ts'
import {
	AppUsageMetricsSchema,
	type AppUsageMetrics,
} from '../shared/metrics.ts'
import { daysToMilliseconds } from '../shared/time.ts'

const log = debug('comapeo:main:persisted-store')

export const StoreStateV1Schema = v.object({
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

const StoreStateV2Schema = v.object({
	...StoreStateV1Schema.entries,
	appUsageMetrics: v.optional(AppUsageMetricsSchema),
	onboardedAt: v.optional(v.pipe(v.number(), v.gtValue(0))),
})

export const CurrentStoreStateSchema = StoreStateV2Schema
export type CurrentStoreState = v.InferOutput<typeof StoreStateV2Schema>

export const PersistedStorageV1Schema = v.object({
	version: v.literal(1),
	state: StoreStateV1Schema,
})
export type PersistedStorageV1 = v.InferOutput<typeof PersistedStorageV1Schema>

export const PersistedStorageV2Schema = v.object({
	version: v.literal(2),
	state: StoreStateV2Schema,
})
export type PersistedStorageV2 = v.InferOutput<typeof PersistedStorageV2Schema>

const PersistedStorageSchema = v.variant('version', [
	PersistedStorageV1Schema,
	PersistedStorageV2Schema,
])

export function createPersistedStore(opts: { filePath: string }) {
	function ensureDirectory() {
		mkdirSync(dirname(opts.filePath), { recursive: true })
	}

	const storage: PersistStorage<CurrentStoreState> = {
		getItem: () => {
			let content
			try {
				ensureDirectory()
				content = readFileSync(opts.filePath, { encoding: 'utf-8' })
			} catch {
				return null
			}

			return v.parse(PersistedStorageSchema, JSON.parse(content), {
				abortEarly: true,
			})
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
			(): CurrentStoreState => {
				return v.getDefaults(CurrentStoreStateSchema)
			},
			{
				name: 'comapeo-persisted',
				version: 2,
				storage,
				migrate: (prevState, version) => {
					if (version === 1) {
						const stateV1 = v.safeParse(StoreStateV1Schema, prevState, {
							abortEarly: true,
						})

						if (stateV1.success) {
							return stateV1.output
						}
					}

					return v.getDefaults(CurrentStoreStateSchema)
				},
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

	// NOTE: Reset app usage metrics if it's been enabled for long enough (1 year)
	const now = Date.now()
	if (
		state.appUsageMetrics &&
		state.appUsageMetrics.status === 'enabled' &&
		now - state.appUsageMetrics.updatedAt >= daysToMilliseconds(365)
	) {
		const updatedAppUsageMetrics: AppUsageMetrics = {
			status: 'disabled',
			askCount: state.appUsageMetrics.askCount,
			updatedAt: now,
			fromReset: true,
		}

		store.setState({ appUsageMetrics: updatedAppUsageMetrics })
	}

	// NOTE: We started to include the region tags for persisted languages after initial release
	// so - if necessary - we migrate existing persisted values to the regional variants that we initially defined.
	if (!state.locale.useSystemPreferences) {
		const languageTagToMigrateTo: SupportedLanguageTag | undefined =
			BASE_LANGUAGE_TO_REGIONAL_VARIANT[state.locale.languageTag]

		if (languageTagToMigrateTo) {
			log(`Migrating ${state.locale.languageTag} to ${languageTagToMigrateTo}`)

			store.setState({
				locale: {
					useSystemPreferences: false,
					languageTag: languageTagToMigrateTo,
				},
			})
		}
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

// NOTE: Defines the initial mappings of potentially existing persisted language tags
// to the initial regional variants that we decided on, as part of the change in our translations setup.
export const BASE_LANGUAGE_TO_REGIONAL_VARIANT: Record<
	string,
	SupportedLanguageTag
> = {
	en: 'en-US',
	fr: 'fr-FR',
	es: 'es-419',
	id: 'id-ID',
	ja: 'ja-JP',
	km: 'km-KH',
	my: 'my-MM',
	ne: 'ne-NP',
	nl: 'nl-NL',
	pt: 'pt-BR',
	si: 'si-LK',
	sw: 'sw-KE',
	ta: 'ta-IN',
	th: 'th-TH',
	vi: 'vi-VN',
}
