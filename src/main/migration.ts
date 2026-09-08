import { access, cp, rm, statfs } from 'node:fs/promises'
import { join } from 'node:path'
import {
	MIGRATION_REASON_NEEDS_UPGRADE,
	MIGRATION_REASON_NO_SPACE,
	checkShouldMigrate,
	migrateStorage,
	type MigrationCheckResult,
	type MigrationResult,
} from '@comapeo/core/migration.js'
import { createDebug } from 'obug'

import type { MigrationStatus } from '../shared/ipc.ts'

const log = createDebug('comapeo:main:migration')

export async function setupMigrationStep(comapeoDataDirectory: string) {
	const { legacy: legacyCoreStoragePath, target: targetCoreStoragePath } =
		await getCoreStorageDirectories(comapeoDataDirectory)

	let migrationStatus: MigrationStatus

	const initPromise = Promise.withResolvers<void>()

	const executionPromise = Promise.withResolvers<void>()

	async function executeMigration({
		onError,
		onStatusUpdate,
	}: {
		onError: (retry: () => Promise<void>) => void
		onStatusUpdate: (status: MigrationStatus) => void
	}) {
		const availableStorage = await getAvailableStorage()

		// TODO: Remove
		// const migrationCheck = await mockedCheckShouldMigrate(
		// 	storageLocation,
		// 	availableStorage,
		// 	migrationStatus
		// 		? undefined
		// 		: {
		// 				shouldUpgrade: false,
		// 				reason: MIGRATION_REASON_NO_SPACE,
		// 				spaceNeeded: 1_000_000,
		// 			},
		// )
		const migrationCheck = await checkShouldMigrate(
			targetCoreStoragePath,
			availableStorage,
		)

		if (!migrationCheck.shouldUpgrade) {
			if (migrationCheck.reason === MIGRATION_REASON_NO_SPACE) {
				log('Cannot migrate core storage due to lack of space')

				migrationStatus = {
					type: 'error:needs_space',
					spaceNeeded: migrationCheck.spaceNeeded,
				}

				onStatusUpdate(migrationStatus)

				onError(async () => executeMigration({ onError, onStatusUpdate }))
			} else {
				log('No need to migrate core storage')

				migrationStatus = { type: 'done' }

				onStatusUpdate(migrationStatus)

				executionPromise.resolve()
			}

			return executionPromise.promise
		}

		migrationStatus = { type: 'progress', current: 0, total: 0 }

		// TODO: Remove
		// const migrationResults = await mockedMigrateStorage(
		// 	storageLocation,
		// 	(doneSoFar, totalCores) => {
		// 		migrationStatus = {
		// 			type: 'progress',
		// 			current: doneSoFar,
		// 			total: totalCores,
		// 		}

		// 		onStatusUpdate(migrationStatus)
		// 	},
		// )
		const migrationResults = await migrateStorage(
			targetCoreStoragePath,
			(doneSoFar, totalCores) => {
				migrationStatus = {
					type: 'progress',
					current: doneSoFar,
					total: totalCores,
				}

				onStatusUpdate(migrationStatus)
			},
		)

		const failedMigration = Object.values(migrationResults).find(
			(r) => !r.migrated,
		)

		if (failedMigration) {
			migrationStatus = {
				type: 'error',
				error: failedMigration.error,
				...(migrationStatus?.type === 'progress'
					? { current: migrationStatus.current, total: migrationStatus.total }
					: { current: 0, total: 0 }),
			}

			log('Failed to migrate core storage for project', failedMigration.error)

			onStatusUpdate(migrationStatus)

			onError(async () => executeMigration({ onError, onStatusUpdate }))
		} else {
			log('Successfully migrated core storage for all projects')

			migrationStatus = { type: 'done' }

			onStatusUpdate(migrationStatus)

			executionPromise.resolve()
		}

		return executionPromise.promise
	}

	return {
		getStatus: async () => {
			await initPromise.promise

			if (!migrationStatus) {
				throw new Error('Expected migration status to be defined')
			}

			return migrationStatus
		},
		run: async ({
			onError,
			onStatusUpdate,
		}: {
			onError: (retry: () => Promise<void>) => void
			onStatusUpdate: (status: MigrationStatus) => void
		}) => {
			await executeMigration({
				onError,
				onStatusUpdate: async (status) => {
					initPromise.resolve()
					onStatusUpdate(status)
				},
			})

			// await rm(legacyCoreStoragePath, { force: true, recursive: true })
		},
	}
}

async function getAvailableStorage() {
	const stats = await statfs(process.platform === 'win32' ? 'C:\\' : '/')

	const total = stats.blocks * stats.bsize
	const free = stats.bfree * stats.bsize
	const used = total - free

	return used
}

async function getCoreStorageDirectories(comapeoDataDirectory: string) {
	const legacy = join(comapeoDataDirectory, 'core-storage')
	// NOTE: Must correspond with `CORE_STORAGE_DIR_NAME` variable in core service
	const target = join(comapeoDataDirectory, 'core-storage-000')

	const legacyExists = await access(legacy)
		.then(() => true)
		.catch(() => false)

	if (legacyExists) {
		await rm(target, { force: true, recursive: true })
		await cp(legacy, target, { force: true, recursive: true })
	}

	return { legacy, target }
}

// TODO: REMOVE
async function mockedCheckShouldMigrate(
	_managerPath: string,
	_availableStorage: number,
	initialResult?: MigrationCheckResult,
): Promise<MigrationCheckResult> {
	if (initialResult) {
		return initialResult
	}

	const result = {
		shouldUpgrade: true,
		reason: MIGRATION_REASON_NEEDS_UPGRADE,

		// shouldUpgrade: false,
		// reason: MIGRATION_REASON_NO_SPACE,
		// spaceNeeded: 1_000_000,

		// shouldUpgrade: false,
		// reason: MIGRATION_REASON_ALREADY_UPGRADED,
	} satisfies MigrationCheckResult

	return result
}

// TODO: REMOVE
async function mockedMigrateStorage(
	_storageLocation: string,
	onProgress?: (doneSoFar: number, totalCores: number) => void,
): Promise<Record<string, MigrationResult>> {
	const progressMap = new Map<string, { current: number; total: number }>([
		['Project 1', { current: 0, total: 100 }],
		['Project 2', { current: 0, total: 50 }],
		['Project 3', { current: 0, total: 10 }],
	])

	function emitProgress() {
		if (!onProgress) {
			return
		}

		let doneSoFar = 0
		let totalCores = 0

		for (const [, { current, total }] of progressMap.entries()) {
			doneSoFar += current
			totalCores += total
		}

		onProgress(doneSoFar, totalCores)
	}

	const results = await Promise.all(
		progressMap.entries().map(async ([name, { total: totalCores }]) => {
			let migrationResult: MigrationResult

			try {
				await simulateProjectMigration(name, totalCores, (doneSoFar) => {
					progressMap.set(name, { current: doneSoFar, total: totalCores })
					emitProgress()
				})
				migrationResult = { migrated: true }
			} catch (reason) {
				migrationResult = {
					migrated: false,
					error:
						reason instanceof Error
							? reason
							: new Error('Error occurred', { cause: reason }),
				}
			}

			return [name, migrationResult] as const
		}),
	)

	return results.reduce(
		(result, current) => {
			result[current[0]] = current[1]
			return result
		},
		{} as Record<string, MigrationResult>,
	)
}

// TODO: REMOVE
async function simulateProjectMigration(
	name: string,
	totalCores: number,
	onUpdate: (doneSoFar: number) => void,
) {
	const migrateStoragePromise = Promise.withResolvers<void>()

	let doneSoFar = 0

	const interval = setInterval(() => {
		doneSoFar += 10

		// if (Math.random() >= 0.75) {
		// 	clearInterval(interval)
		// 	migrateStoragePromise.reject(`Failed to migrate project ${name}`)
		// 	return
		// }

		onUpdate(doneSoFar)

		if (doneSoFar === totalCores) {
			clearInterval(interval)
			migrateStoragePromise.resolve()
		}
	}, 1_000)

	return migrateStoragePromise.promise
}
