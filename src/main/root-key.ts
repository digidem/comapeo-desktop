import { randomBytes } from 'node:crypto'
import type { SafeStorage } from 'electron/main'
import { createDebug } from 'obug'
import * as v from 'valibot'

import {
	RootKeyAsHexSchema,
	type PersistedStore,
	type RootKeyRecord,
} from './persisted-store.ts'

class RootKeyError extends Error {}

type Encryption = {
	encrypt: (input: string) => Buffer
	decrypt: (input: Buffer) => string
	isAvailable: () => boolean
	getBackend: () =>
		ReturnType<SafeStorage['getSelectedStorageBackend']> | undefined
}

const log = createDebug('comapeo:main:root-key')

/**
 * Extracts the root key to use from persisted storage if possible based on the existence of
 * the "legacy" field (`rootKey`) and the newly added field (`rootKeyRecord`).
 *
 * Also handles migration from the legacy field if necessary.
 *
 * If neither exist, generates and persists a new key.
 *
 * @returns Root key as hexidecimal string
 */
export function loadRootKey({
	encryption,
	persistedStore,
}: {
	encryption: Encryption
	persistedStore: PersistedStore
}): string {
	const { rootKey: legacyRootKey, rootKeyRecord } = persistedStore.getState()

	// NOTE: Already migrated to `rootKeyRecord`
	if (rootKeyRecord) {
		log('Using root key from existing root key record')

		return decode(rootKeyRecord, encryption)
	}

	// NOTE: Handle legacy value that has yet to be migrated. Determined based on the format of value
	// with the assumption that a ciphertext (v10/v11 prefix + AES block) can never be exactly 32 hex chars.
	if (legacyRootKey) {
		log('Using legacy root key field and migrating to root key record')

		const record: RootKeyRecord = {
			encrypted: !v.is(RootKeyAsHexSchema, legacyRootKey),
			value: legacyRootKey,
		}

		const key = decode(record, encryption)

		// NOTE: Legacy `rootKey` is intentionally left in place for now
		persistedStore.setState({ rootKeyRecord: record })

		return key
	}

	// NOTE: Handle fresh install
	log('Generating new root key')

	const key = randomBytes(16).toString('hex')

	const backend = encryption.getBackend()
	const shouldEncrypt = encryption.isAvailable() && backend !== 'basic_text'

	let record: RootKeyRecord

	if (shouldEncrypt) {
		log('Using encrypted root key')

		record = { encrypted: true, value: encryption.encrypt(key).toString('hex') }

		if (backend) {
			record.backend = backend

			log('Backend used for root key encryption: %s', backend)
		}
	} else {
		log('Using plain root key')

		record = { encrypted: false, value: key }
	}

	persistedStore.setState({ rootKeyRecord: record })

	return key
}

function decode(record: RootKeyRecord, encryption: Encryption): string {
	if (!record.encrypted) {
		return record.value
	}

	if (!encryption.isAvailable()) {
		throw new RootKeyError(
			'Root key is encrypted but encryption is not available',
		)
	}

	let key: string

	try {
		key = encryption.decrypt(Buffer.from(record.value, 'hex'))
	} catch (cause) {
		throw new RootKeyError('Failed to decrypt root key', { cause })
	}

	// NOTE: A wrong key can decrypt "successfully" to an invalid value
	if (!v.is(RootKeyAsHexSchema, key)) {
		throw new RootKeyError('Decrypted root key has unexpected format')
	}

	return key
}
