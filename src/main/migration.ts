import { access, cp, rm, statfs } from 'node:fs/promises'
import { join } from 'node:path'
import {
	MIGRATION_REASON_NO_SPACE,
	checkShouldMigrate,
	migrateStorage,
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
