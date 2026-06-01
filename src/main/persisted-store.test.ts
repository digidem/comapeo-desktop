import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as v from 'valibot'
import { describe, expect, test, vi, type TestContext } from 'vitest'

import type { AppUsageMetrics } from '../shared/metrics.ts'
import { daysToMilliseconds } from '../shared/time.ts'
import {
	BASE_LANGUAGE_TO_REGIONAL_VARIANT,
	CurrentStoreStateSchema,
	PersistedStorageV3Schema,
	StoreStateV1Schema,
	StoreStateV2Schema,
	createPersistedStore,
	type PersistedStorageV1,
	type PersistedStorageV2,
	type PersistedStorageV3,
} from './persisted-store.ts'

test('default store state value', () => {
	expect(v.getDefaults(CurrentStoreStateSchema)).toStrictEqual({
		activeProjectId: undefined,
		appUsageMetrics: undefined,
		coordinateFormat: 'utm',
		diagnosticsEnabled: true,
		locale: { languageTag: null, useSystemPreferences: true },
		onboardedAt: undefined,
		rootKey: undefined,
		sentryUser: { id: expect.any(String), idMonth: expect.any(String) },
		metricsDeviceId: expect.any(String),
		unitSystem: 'metric',
	})
})

test('no initial storage value', async (t) => {
	const { filePath } = await setup(t)

	const store = createPersistedStore({ filePath })

	// Initial
	{
		const storage = JSON.parse(readFileSync(filePath, 'utf-8'))

		expect(storage).toStrictEqual(
			expect.schemaMatching(PersistedStorageV3Schema),
		)
	}

	// After state update
	{
		const activeProjectId = 'test'

		store.setState({ activeProjectId })

		const storage = JSON.parse(readFileSync(filePath, 'utf-8'))

		expect(storage).toStrictEqual(
			expect.schemaMatching(PersistedStorageV3Schema),
		)

		expect(storage.state.activeProjectId).toBe(activeProjectId)
	}
})

test('with initial storage value matching current schema', async (t) => {
	const { filePath } = await setup(t)

	const initialStorage: PersistedStorageV2 = JSON.parse(
		JSON.stringify({
			version: 3,
			state: v.getDefaults(CurrentStoreStateSchema),
		}),
	)

	writeFileSync(filePath, JSON.stringify(initialStorage), 'utf-8')

	const store = createPersistedStore({ filePath })

	expect(store.getState(), 'store state matches initial state').toMatchObject(
		initialStorage.state,
	)

	const updatedStorage = JSON.parse(readFileSync(filePath, 'utf-8'))

	expect(
		updatedStorage,
		'updated storage matches initial storage',
	).toMatchObject(initialStorage)
})

describe('migrations', () => {
	// TODO: Might make more sense to throw loudly
	test('from invalid', async (t) => {
		const { filePath } = await setup(t)

		const invalidInitialStorage = {
			version: 0,
			state: { activeProjectId: 'test' },
		}

		writeFileSync(filePath, JSON.stringify(invalidInitialStorage), 'utf-8')

		const store = createPersistedStore({ filePath })

		expect(
			store.getState(),
			'state matches current state schema',
		).toStrictEqual(expect.schemaMatching(CurrentStoreStateSchema))

		expect(
			store.getState().activeProjectId,
			'state does not preserve state values from invalid storage',
		).not.toStrictEqual(invalidInitialStorage.state.activeProjectId)

		const updatedStorage = JSON.parse(readFileSync(filePath, 'utf-8'))

		expect(updatedStorage, 'storage value is migrated').toStrictEqual(
			expect.schemaMatching(PersistedStorageV3Schema),
		)

		expect(
			store.getState(),
			'state in storage value matches store state',
		).toMatchObject(updatedStorage.state)
	})

	test('from v1', async (t) => {
		const { filePath } = await setup(t)

		const initialStorage: PersistedStorageV1 = {
			version: 1,
			state: v.getDefaults(StoreStateV1Schema),
		}

		writeFileSync(filePath, JSON.stringify(initialStorage), 'utf-8')

		const store = createPersistedStore({ filePath })

		expect(store.getState()).toStrictEqual(
			expect.schemaMatching(CurrentStoreStateSchema),
		)

		const updatedStorage = JSON.parse(readFileSync(filePath, 'utf-8'))

		expect(updatedStorage, 'storage value is migrated').toStrictEqual(
			expect.schemaMatching(PersistedStorageV3Schema),
		)

		expect(
			store.getState(),
			'original state values are not lost',
		).toMatchObject(initialStorage.state)
	})

	test('from v2', async (t) => {
		const { filePath } = await setup(t)

		const initialStorage: PersistedStorageV2 = {
			version: 2,
			state: v.getDefaults(StoreStateV2Schema),
		}

		writeFileSync(filePath, JSON.stringify(initialStorage), 'utf-8')

		const store = createPersistedStore({ filePath })

		expect(store.getState()).toStrictEqual(
			expect.schemaMatching(CurrentStoreStateSchema),
		)

		const updatedStorage = JSON.parse(readFileSync(filePath, 'utf-8'))

		expect(updatedStorage, 'storage value is migrated').toStrictEqual(
			expect.schemaMatching(PersistedStorageV3Schema),
		)

		expect(
			store.getState(),
			'original state values are not lost',
		).toMatchObject(initialStorage.state)
	})
})

test('sentry user rotation behavior', async (t) => {
	vi.useFakeTimers()

	const { filePath } = await setup(t)

	let store = createPersistedStore({ filePath })
	const initialSentryUser = store.getState().sentryUser

	expect(initialSentryUser).toBeDefined()

	vi.advanceTimersByTime(daysToMilliseconds(31))

	store = createPersistedStore({ filePath })

	expect(store.getState().sentryUser).not.toStrictEqual(initialSentryUser)
})

describe('app usage metrics reset behavior', () => {
	test.beforeEach(() => {
		vi.useFakeTimers()
	})

	test('does not reset when app usage metrics is not set', async (t) => {
		const { filePath } = await setup(t)

		let store = createPersistedStore({ filePath })

		expect(store.getState().appUsageMetrics).toBeUndefined()

		vi.advanceTimersByTime(daysToMilliseconds(365))

		store = createPersistedStore({ filePath })

		expect(store.getState().appUsageMetrics).toBeUndefined()
	})

	test('does not reset when app usage metrics is disabled', async (t) => {
		const { filePath } = await setup(t)

		let store = createPersistedStore({ filePath })

		const initialAppUsageMetrics: AppUsageMetrics = {
			status: 'disabled',
			askCount: 0,
			updatedAt: Date.now(),
			fromReset: false,
		}

		store.setState({ appUsageMetrics: initialAppUsageMetrics })

		vi.advanceTimersByTime(daysToMilliseconds(365))

		store = createPersistedStore({ filePath })

		expect(store.getState().appUsageMetrics).toStrictEqual(
			initialAppUsageMetrics,
		)
	})

	test('resets when app usage metrics is enabled for a long enough period', async (t) => {
		const { filePath } = await setup(t)

		let store = createPersistedStore({ filePath })

		const initialAppUsageMetrics: AppUsageMetrics = {
			status: 'enabled',
			askCount: 1,
			updatedAt: Date.now(),
		}

		store.setState({ appUsageMetrics: initialAppUsageMetrics })

		vi.advanceTimersByTime(daysToMilliseconds(364))

		store = createPersistedStore({ filePath })

		expect(store.getState().appUsageMetrics).toStrictEqual(
			initialAppUsageMetrics,
		)

		vi.advanceTimersByTime(daysToMilliseconds(1))

		store = createPersistedStore({ filePath })

		const expectedAppUsageMetrics: AppUsageMetrics = {
			status: 'disabled',
			askCount: 1,
			updatedAt: Date.now(),
			fromReset: true,
		}

		expect(
			store.getState().appUsageMetrics,
			'state uses reset value',
		).toStrictEqual(expectedAppUsageMetrics)

		const storage = JSON.parse(readFileSync(filePath, 'utf-8'))

		expect(
			storage.state.appUsageMetrics,
			'storage is updated with reset value',
		).toStrictEqual(expectedAppUsageMetrics)
	})
})

describe('locale migration', () => {
	test('does not occur when using system preferences', async (t) => {
		const { filePath } = await setup(t)

		const initialStorage: PersistedStorageV3 = {
			version: 3,
			state: {
				...v.getDefaults(CurrentStoreStateSchema),
				locale: { useSystemPreferences: true, languageTag: null },
			},
		}

		writeFileSync(filePath, JSON.stringify(initialStorage), 'utf-8')

		const store = createPersistedStore({ filePath })

		expect(store.getState().locale).toStrictEqual({
			useSystemPreferences: true,
			languageTag: null,
		})
	})

	test('does not occur for non-applicable language', async (t) => {
		const { filePath } = await setup(t)

		const initialStorage: PersistedStorageV2 = {
			version: 2,
			state: {
				...v.getDefaults(CurrentStoreStateSchema),
				locale: { useSystemPreferences: false, languageTag: 'way' },
			},
		}

		writeFileSync(filePath, JSON.stringify(initialStorage), 'utf-8')

		const store = createPersistedStore({ filePath })

		expect(store.getState().locale).toStrictEqual({
			useSystemPreferences: false,
			languageTag: 'way',
		})
	})

	for (const [baseLanguageTag, expectedRegionalVariant] of Object.entries(
		BASE_LANGUAGE_TO_REGIONAL_VARIANT,
	)) {
		test(`${baseLanguageTag} to ${expectedRegionalVariant}`, async (t) => {
			const { filePath } = await setup(t)

			const initialStorage: PersistedStorageV2 = {
				version: 2,
				state: {
					...v.getDefaults(CurrentStoreStateSchema),
					locale: { useSystemPreferences: false, languageTag: baseLanguageTag },
				},
			}

			writeFileSync(filePath, JSON.stringify(initialStorage), 'utf-8')

			const store = createPersistedStore({ filePath })

			expect(store.getState().locale).toStrictEqual({
				useSystemPreferences: false,
				languageTag: expectedRegionalVariant,
			})
		})
	}
})

async function setup(t: TestContext) {
	const dir = await mkdtemp(join(tmpdir(), 'persisted-store-'))
	const filePath = join(dir, 'data.json')

	t.onTestFinished(() => {
		rmSync(dir, { recursive: true, force: true })
	})

	return { filePath }
}
