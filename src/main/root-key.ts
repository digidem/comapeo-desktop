import { randomBytes } from 'node:crypto'
import { type DecryptStringAsyncReturnValue, type SafeStorage } from 'electron'
import { createDebug } from 'obug'
import * as v from 'valibot'

import {
	RootKeyAsHexSchema,
	type EncryptedRootKeyRecord,
	type PersistedStore,
	type PlainTextRootKeyRecord,
	type RootKeyRecord,
} from './persisted-store.ts'

class RootKeyError extends Error {}

type Encryption = {
	encrypt: (input: string) => Promise<Buffer>
	decrypt: (input: Buffer) => Promise<DecryptStringAsyncReturnValue>
	isAvailable: () => Promise<boolean>
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
 * This should only be called after the app is ready (`'ready'` event has been emitted).
 *
 * @returns Root key as hexidecimal string
 */
export async function loadRootKey({
	encryption,
	persistedStore,
}: {
	encryption: Encryption
	persistedStore: PersistedStore
}): Promise<string> {
	const { rootKey: legacyRootKey, rootKeyRecord } = persistedStore.getState()

	// NOTE: Already migrated to `rootKeyRecord`
	if (rootKeyRecord) {
		log('Using root key from existing root key record')

		if (!rootKeyRecord.encrypted) {
			return rootKeyRecord.value
		}

		const { result: decodedRootKey, shouldReEncrypt } = await decode(
			rootKeyRecord.value,
			encryption,
		)

		if (shouldReEncrypt) {
			// TODO: Handle re-encryption
			log('Root key can be re-encrypted. Skipping for now.')
		}

		return decodedRootKey
	}

	// NOTE: Handle legacy value that has yet to be migrated. Determined based on the format of value
	// with the assumption that a ciphertext (v10/v11 prefix + AES block) can never be exactly 32 hex chars.
	if (legacyRootKey) {
		log('Using legacy root key field and will migrate to root key record')

		if (v.is(RootKeyAsHexSchema, legacyRootKey)) {
			log('Migrating plain text legacy root key')

			const record = { encrypted: false, value: legacyRootKey }

			// NOTE: Legacy `rootKey` is intentionally left in place for now
			persistedStore.setState({ rootKeyRecord: record })

			return legacyRootKey
		}

		log('Migrating encrypted legacy root key')

		const { result: decryptedRootKey, shouldReEncrypt } = await decode(
			legacyRootKey,
			encryption,
		)

		if (shouldReEncrypt) {
			// TODO: Handle re-encryption
			log('Root key can be re-encrypted. Skipping for now.')
		}

		const record: EncryptedRootKeyRecord = {
			encrypted: true,
			value: legacyRootKey,
		}

		// NOTE: Legacy `rootKey` is intentionally left in place for now
		persistedStore.setState({ rootKeyRecord: record })

		return decryptedRootKey
	}

	// NOTE: Handle fresh install
	log('Generating new root key')

	const key = randomBytes(16).toString('hex')

	const record = await encode(key, encryption)

	if (record.encrypted) {
		log('Using encrypted root key')

		if (record.backend) {
			log('Backend used for root key encryption: %s', record.backend)
		}
	} else {
		log('Using plain text root key')
	}

	persistedStore.setState({ rootKeyRecord: record })

	return key
}

async function decode(
	input: string,
	encryption: Encryption,
): Promise<DecryptStringAsyncReturnValue> {
	const encryptionIsAvailable = await encryption.isAvailable()

	if (!encryptionIsAvailable) {
		throw new RootKeyError(
			'Root key is encrypted but encryption is not available',
		)
	}

	let value: DecryptStringAsyncReturnValue

	try {
		value = await encryption.decrypt(Buffer.from(input, 'hex'))
	} catch (cause) {
		throw new RootKeyError('Failed to decrypt root key', { cause })
	}

	// NOTE: A wrong key can decrypt "successfully" to an invalid value
	if (!v.is(RootKeyAsHexSchema, value.result)) {
		throw new RootKeyError('Decrypted root key has unexpected format')
	}

	return value
}

async function encode(
	input: string,
	encryption: Encryption,
): Promise<RootKeyRecord> {
	const backend = encryption.getBackend()

	if (backend === 'unknown') {
		throw new RootKeyError(
			'Cannot encrypt root key before app is ready (encryption backend is unknown)',
		)
	}

	const isAvailable = await encryption.isAvailable()

	const shouldEncrypt = isAvailable && backend !== 'basic_text'

	if (!shouldEncrypt) {
		return { encrypted: false, value: input } satisfies PlainTextRootKeyRecord
	}

	const encrypted = await encryption.encrypt(input)

	const record: EncryptedRootKeyRecord = {
		encrypted: true,
		value: encrypted.toString('hex'),
	}

	if (backend) {
		record.backend = backend
	}

	return record
}
