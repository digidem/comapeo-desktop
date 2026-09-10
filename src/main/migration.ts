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
	const legacyCoreStorageDirectory = join(comapeoDataDirectory, 'core-storage')
	const targetCoreStorageDirectory = join(
		comapeoDataDirectory,
		// NOTE: Must correspond with `CORE_STORAGE_DIR_NAME` variable in core service
		'core-storage-000',
	)

	const legacyExists = await access(legacyCoreStorageDirectory)
		.then(() => true)
		.catch(() => false)

	if (legacyExists) {
		await rm(targetCoreStorageDirectory, { force: true, recursive: true })
		await cp(legacyCoreStorageDirectory, targetCoreStorageDirectory, {
			force: true,
			recursive: true,
		})
	}

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
			targetCoreStorageDirectory,
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
			targetCoreStorageDirectory,
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
				onStatusUpdate: (status) => {
					initPromise.resolve()
					onStatusUpdate(status)
				},
			})

			// TODO: Eventually delete `legacyCoreStorageDirectory`
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
