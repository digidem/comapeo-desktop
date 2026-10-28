import { randomBytes } from 'node:crypto'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { SafeStorage } from 'electron/main'
import * as v from 'valibot'
import { describe, expect, test, vi, type TestContext } from 'vitest'

import {
	CurrentStoreStateSchema,
	PersistedStorageV3Schema,
	RootKeyAsHexSchema,
	createPersistedStore,
	type PersistedStorageV3,
	type RootKeyRecord,
} from '../persisted-store.ts'
import { loadRootKey } from '../root-key.ts'

describe('fresh install', () => {
	test('encrypts when a real secret store is available', async (t) => {
		const { filePath } = await setup(t)

		const { encryption } = createFakeEncryption({
			available: true,
			backend: 'gnome_libsecret',
		})

		const persistedStore = createPersistedStore({ filePath })

		const key = await loadRootKey({ encryption, persistedStore })

		expect(key).toStrictEqual(expect.schemaMatching(RootKeyAsHexSchema))

		const { rootKey, rootKeyRecord } = persistedStore.getState()

		expect(rootKey, 'legacy field is not written').toBeUndefined()

		expect(rootKeyRecord).toMatchObject({
			encrypted: true,
			backend: 'gnome_libsecret',
		})

		expect(
			rootKeyRecord?.value,
			'stored value is not the raw key',
		).not.toStrictEqual(key)

		const { result: decryptedKey } = await encryption.decrypt(
			Buffer.from(rootKeyRecord!.value, 'hex'),
		)

		expect(
			decryptedKey,
			'stored value decrypts to the returned key',
		).toStrictEqual(key)

		expect(encryption.encrypt).toHaveBeenCalledTimes(1)
	})

	test('encrypts without a backend on platforms that do not report one', async (t) => {
		const { filePath } = await setup(t)

		const { encryption } = createFakeEncryption({
			available: true,
			backend: undefined,
		})

		const persistedStore = createPersistedStore({ filePath })

		const key = await loadRootKey({ encryption, persistedStore })

		const { rootKeyRecord } = persistedStore.getState()

		expect(rootKeyRecord).toStrictEqual({
			encrypted: true,
			value: expect.any(String),
		})

		const { result: decrypted } = await encryption.decrypt(
			Buffer.from(rootKeyRecord!.value, 'hex'),
		)

		expect(decrypted).toStrictEqual(key)

		expect(encryption.encrypt).toHaveBeenCalledTimes(1)
	})

	test('stores plaintext when encryption is not available', async (t) => {
		const { filePath } = await setup(t)

		const { encryption } = createFakeEncryption({ available: false })

		const persistedStore = createPersistedStore({ filePath })

		const key = await loadRootKey({ encryption, persistedStore })

		expect(key).toStrictEqual(expect.schemaMatching(RootKeyAsHexSchema))

		expect(persistedStore.getState().rootKeyRecord).toStrictEqual({
			encrypted: false,
			value: key,
		})

		expect(encryption.encrypt).not.toHaveBeenCalled()
	})

	test('stores plaintext when the Linux backend is basic_text', async (t) => {
		const { filePath } = await setup(t)

		const { encryption } = createFakeEncryption({
			available: true,
			backend: 'basic_text',
		})

		const persistedStore = createPersistedStore({ filePath })

		const key = await loadRootKey({ encryption, persistedStore })

		expect(persistedStore.getState().rootKeyRecord).toStrictEqual({
			encrypted: false,
			value: key,
		})

		expect(encryption.encrypt).not.toHaveBeenCalled()
	})

	test('generates a different key for each new install', async (t) => {
		const first = await setup(t)
		const second = await setup(t)

		const { encryption } = createFakeEncryption()

		const keyA = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath: first.filePath }),
		})
		const keyB = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath: second.filePath }),
		})

		expect(keyA).not.toStrictEqual(keyB)
	})

	test('persists the record to disk', async (t) => {
		const { filePath } = await setup(t)

		const { encryption } = createFakeEncryption()

		const persistedStore = createPersistedStore({ filePath })

		await loadRootKey({ encryption, persistedStore })

		const storage = readStorage(filePath)

		expect(storage).toStrictEqual(
			expect.schemaMatching(PersistedStorageV3Schema),
		)

		expect(persistedStore.getState().rootKeyRecord).toMatchObject(
			storage.state.rootKeyRecord,
		)
	})

	test('propagates encryption errors without persisting anything', async (t) => {
		const { filePath } = await setup(t)

		const { encryption } = createFakeEncryption()

		encryption.encrypt.mockImplementationOnce(() => {
			throw new Error('encrypt failed')
		})

		const persistedStore = createPersistedStore({ filePath })

		await expect(() =>
			loadRootKey({ encryption, persistedStore }),
		).rejects.toThrow('encrypt failed')

		expect(persistedStore.getState().rootKeyRecord).toBeUndefined()

		expect(readStorage(filePath).state.rootKeyRecord).toBeUndefined()
	})
})

describe('existing `rootKeyRecord`', () => {
	test('plaintext record is returned as-is without touching encryption', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		writeStorage(filePath, {
			rootKeyRecord: { encrypted: false, value: exampleRootKey },
		})

		const { encryption } = createFakeEncryption({ available: false })

		const key = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		expect(key).toStrictEqual(exampleRootKey)

		expect(encryption.decrypt).not.toHaveBeenCalled()

		expect(encryption.encrypt).not.toHaveBeenCalled()
	})

	test('encrypted record is decrypted', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		writeStorage(filePath, {
			rootKeyRecord: {
				encrypted: true,
				value: fakeEncrypt(exampleRootKey).toString('hex'),
				backend: 'gnome_libsecret',
			},
		})

		const { encryption } = createFakeEncryption()

		const key = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		expect(key).toStrictEqual(exampleRootKey)

		expect(encryption.decrypt).toHaveBeenCalledTimes(1)
	})

	test('takes precedence over the legacy field', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')
		const legacyRootKey = randomBytes(16).toString('hex')

		writeStorage(filePath, {
			rootKey: legacyRootKey,
			rootKeyRecord: { encrypted: false, value: exampleRootKey },
		})

		const { encryption } = createFakeEncryption()

		const persistedStore = createPersistedStore({ filePath })

		const key = await loadRootKey({ encryption, persistedStore })

		expect(key).toStrictEqual(exampleRootKey)

		expect(
			persistedStore.getState().rootKey,
			'legacy field untouched',
		).toStrictEqual(legacyRootKey)
	})

	test('throws when encrypted but encryption is unavailable, without modifying storage', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		const record: RootKeyRecord = {
			encrypted: true,
			value: fakeEncrypt(exampleRootKey).toString('hex'),
			backend: 'gnome_libsecret',
		}

		writeStorage(filePath, { rootKeyRecord: record })

		const { encryption } = createFakeEncryption({ available: false })

		const persistedStore = createPersistedStore({ filePath })

		await expect(() =>
			loadRootKey({ encryption, persistedStore }),
		).rejects.toThrow(/encryption is not available/)

		expect(encryption.decrypt).not.toHaveBeenCalled()

		expect(persistedStore.getState().rootKeyRecord).toStrictEqual(record)

		expect(readStorage(filePath).state.rootKeyRecord).toStrictEqual(record)
	})

	test('wraps decryption failures and preserves the cause', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		writeStorage(filePath, {
			rootKeyRecord: {
				encrypted: true,
				value: fakeEncrypt(exampleRootKey).toString('hex'),
			},
		})

		const { encryption } = createFakeEncryption()

		const cause = new Error('keyring locked')

		encryption.decrypt.mockImplementationOnce(() => {
			throw cause
		})

		let err: Error

		await expect(async () => {
			try {
				await loadRootKey({
					encryption,
					persistedStore: createPersistedStore({ filePath }),
				})
			} catch (reason) {
				if (reason instanceof Error) {
					err = reason
					throw reason
				}

				throw new Error('Thrown value is not an Error', { cause: reason })
			}
		}).rejects.toThrow('Failed to decrypt root key')

		expect(err!.cause).toStrictEqual(cause)
	})

	test('throws when decryption returns a value in an unexpected format', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		writeStorage(filePath, {
			rootKeyRecord: {
				encrypted: true,
				value: fakeEncrypt(exampleRootKey).toString('hex'),
			},
		})

		const { encryption } = createFakeEncryption()

		// NOTE: Simulates decrypting with the wrong key without throwing
		encryption.decrypt.mockReturnValueOnce(
			Promise.resolve({
				result: '\u0000garbage\ufffd',
				shouldReEncrypt: false,
			}),
		)

		await expect(() =>
			loadRootKey({
				encryption,
				persistedStore: createPersistedStore({ filePath }),
			}),
		).rejects.toThrow(/unexpected format/)
	})
})

describe('legacy `rootKey` migration', () => {
	test('plaintext legacy key is migrated as plaintext, not upgraded to encrypted', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		writeStorage(filePath, { rootKey: exampleRootKey })

		const { encryption } = createFakeEncryption({
			available: true,
			backend: 'gnome_libsecret',
		})

		const persistedStore = createPersistedStore({ filePath })

		const key = await loadRootKey({ encryption, persistedStore })

		expect(key).toStrictEqual(exampleRootKey)

		expect(persistedStore.getState().rootKeyRecord).toStrictEqual({
			encrypted: false,
			value: exampleRootKey,
		})

		expect(encryption.encrypt).not.toHaveBeenCalled()

		expect(encryption.decrypt).not.toHaveBeenCalled()
	})

	test('plaintext legacy key is accepted even when encryption is unavailable', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		writeStorage(filePath, { rootKey: exampleRootKey })

		const { encryption } = createFakeEncryption({ available: false })

		const key = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		expect(key).toStrictEqual(exampleRootKey)
	})

	test('ciphertext legacy key is decrypted and migrated', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		const legacyCiphertext = fakeEncrypt(exampleRootKey).toString('hex')

		expect(
			legacyCiphertext,
			'sanity: ciphertext is not key-shaped',
		).not.toStrictEqual(expect.schemaMatching(RootKeyAsHexSchema))

		writeStorage(filePath, { rootKey: legacyCiphertext })

		const { encryption } = createFakeEncryption()

		const persistedStore = createPersistedStore({ filePath })

		const key = await loadRootKey({ encryption, persistedStore })

		expect(key).toStrictEqual(exampleRootKey)

		expect(persistedStore.getState().rootKeyRecord).toStrictEqual({
			encrypted: true,
			value: legacyCiphertext,
		})

		expect(encryption.encrypt, 'not re-encrypted').not.toHaveBeenCalled()
	})

	test('legacy field is left in place after migrating', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		const legacyCiphertext = fakeEncrypt(exampleRootKey).toString('hex')

		writeStorage(filePath, { rootKey: legacyCiphertext })

		const { encryption } = createFakeEncryption()

		const persistedStore = createPersistedStore({ filePath })

		await loadRootKey({ encryption, persistedStore })

		expect(persistedStore.getState().rootKey).toStrictEqual(legacyCiphertext)

		const storage = readStorage(filePath)

		expect(storage).toStrictEqual(
			expect.schemaMatching(PersistedStorageV3Schema),
		)

		expect(storage.state.rootKey).toStrictEqual(legacyCiphertext)

		expect(storage.state.rootKeyRecord).toStrictEqual({
			encrypted: true,
			value: legacyCiphertext,
		})
	})

	test('ciphertext legacy key with unavailable encryption throws and does not generate a new key', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		const legacyCiphertext = fakeEncrypt(exampleRootKey).toString('hex')

		writeStorage(filePath, { rootKey: legacyCiphertext })

		const { encryption } = createFakeEncryption({ available: false })

		const persistedStore = createPersistedStore({ filePath })

		await expect(() =>
			loadRootKey({ encryption, persistedStore }),
		).rejects.toThrow(/encryption is not available/)

		expect(encryption.encrypt).not.toHaveBeenCalled()

		expect(persistedStore.getState().rootKeyRecord).toBeUndefined()

		expect(persistedStore.getState().rootKey).toStrictEqual(legacyCiphertext)

		const storage = readStorage(filePath)

		expect(storage.state.rootKeyRecord).toBeUndefined()

		expect(storage.state.rootKey).toStrictEqual(legacyCiphertext)
	})

	test('ciphertext legacy key that fails to decrypt throws without writing a record', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		const legacyCiphertext = fakeEncrypt(exampleRootKey).toString('hex')

		writeStorage(filePath, { rootKey: legacyCiphertext })

		const { encryption } = createFakeEncryption()

		encryption.decrypt.mockImplementationOnce(() => {
			throw new Error('keyring locked')
		})

		const persistedStore = createPersistedStore({ filePath })

		await expect(() =>
			loadRootKey({ encryption, persistedStore }),
		).rejects.toThrow('Failed to decrypt root key')

		expect(persistedStore.getState().rootKeyRecord).toBeUndefined()

		expect(persistedStore.getState().rootKey).toStrictEqual(legacyCiphertext)
	})

	test('ciphertext legacy key that decrypts to garbage throws without writing a record', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		writeStorage(filePath, {
			rootKey: fakeEncrypt(exampleRootKey).toString('hex'),
		})

		const { encryption } = createFakeEncryption()

		encryption.decrypt.mockReturnValueOnce(
			Promise.resolve({ result: 'not-a-valid-key', shouldReEncrypt: false }),
		)

		const persistedStore = createPersistedStore({ filePath })

		await expect(() =>
			loadRootKey({ encryption, persistedStore }),
		).rejects.toThrow(/unexpected format/)

		expect(persistedStore.getState().rootKeyRecord).toBeUndefined()
	})

	test('legacy value that is neither a key nor decryptable throws', async (t) => {
		const { filePath } = await setup(t)

		writeStorage(filePath, { rootKey: 'definitely-not-a-key-or-ciphertext' })

		const { encryption } = createFakeEncryption()

		const persistedStore = createPersistedStore({ filePath })

		await expect(() =>
			loadRootKey({ encryption, persistedStore }),
		).rejects.toThrow('Failed to decrypt root key')

		expect(persistedStore.getState().rootKeyRecord).toBeUndefined()
	})
})

describe('across launches', () => {
	test('returns the same key on every launch', async (t) => {
		const { filePath } = await setup(t)

		const { encryption } = createFakeEncryption()

		const first = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		const second = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		const third = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		expect(second).toStrictEqual(first)

		expect(third).toStrictEqual(first)

		expect(
			encryption.encrypt,
			'only encrypted on first launch',
		).toHaveBeenCalledTimes(1)
	})

	test('migrated legacy key is stable across launches', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		writeStorage(filePath, {
			rootKey: fakeEncrypt(exampleRootKey).toString('hex'),
		})

		const { encryption } = createFakeEncryption()

		const first = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		const second = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		expect(first).toStrictEqual(exampleRootKey)

		expect(second).toStrictEqual(exampleRootKey)
	})

	// Regression test for the original bug: the root key was encrypted on the first launch,
	// but encryption was unavailable on a later one, and the stored ciphertext was
	// passed along as if it were the key.
	test('does not use ciphertext as the key when encryption becomes unavailable on a later launch', async (t) => {
		const { filePath } = await setup(t)

		const { encryption, state } = createFakeEncryption({
			available: true,
			backend: 'gnome_libsecret',
		})

		const keyBefore = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		const recordBefore = readStorage(filePath).state.rootKeyRecord

		expect(recordBefore.encrypted).toStrictEqual(true)

		// Later launch: keyring not available (e.g. locked, no secret service, different desktop env)
		state.available = false

		await expect(() =>
			loadRootKey({
				encryption,
				persistedStore: createPersistedStore({ filePath }),
			}),
		).rejects.toThrow(/encryption is not available/)

		expect(
			readStorage(filePath).state.rootKeyRecord,
			'stored record is not replaced or regenerated',
		).toStrictEqual(recordBefore)

		// Keyring becomes available again: the original key is recovered
		state.available = true

		const keyAfter = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		expect(keyAfter).toStrictEqual(keyBefore)
	})

	test('plaintext key is not affected by encryption becoming available later', async (t) => {
		const { filePath } = await setup(t)

		const { encryption, state } = createFakeEncryption({ available: false })

		const key = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		// Later launch: a real secret store is now available
		state.available = true
		state.backend = 'gnome_libsecret'

		const second = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		expect(second).toStrictEqual(key)

		expect(
			encryption.decrypt,
			'does not try to decrypt plaintext',
		).not.toHaveBeenCalled()
	})

	// TODO: Enable when re-encryption of stored key handled explicitly.
	test.skip('replaces the ciphertext when re-encryption should occur', async (t) => {
		const { filePath } = await setup(t)

		const exampleRootKey = randomBytes(16).toString('hex')

		const recordBefore: RootKeyRecord = { encrypted: true, value: 'abcde123' }

		writeStorage(filePath, { rootKeyRecord: recordBefore })

		const { encryption } = createFakeEncryption()

		encryption.decrypt.mockReturnValueOnce(
			Promise.resolve({ result: exampleRootKey, shouldReEncrypt: true }),
		)

		const key = await loadRootKey({
			encryption,
			persistedStore: createPersistedStore({ filePath }),
		})

		expect(encryption.encrypt).toHaveBeenCalledOnce()

		expect(
			readStorage(filePath).state.rootKeyRecord,
			'stored record is replaced or regenerated',
		).not.toStrictEqual(recordBefore)

		expect(key).toStrictEqual(exampleRootKey)
	})
})

async function setup(t: TestContext) {
	const dir = await mkdtemp(join(tmpdir(), 'root-key-'))
	const filePath = join(dir, 'data.json')

	t.onTestFinished(() => {
		rmSync(dir, { recursive: true, force: true })
	})

	return { filePath }
}

function writeStorage(
	filePath: string,
	state: Partial<PersistedStorageV3['state']>,
) {
	const storage: PersistedStorageV3 = {
		version: 3,
		state: { ...v.getDefaults(CurrentStoreStateSchema), ...state },
	}

	writeFileSync(filePath, JSON.stringify(storage), 'utf-8')
}

function readStorage(filePath: string) {
	return JSON.parse(readFileSync(filePath, 'utf-8'))
}

// NOTE: Mimics the shape of a real ciphertext: prefix + payload, hex encoded.
// The result is always longer than 32 hex chars, like real v10/v11 ciphertexts.
function fakeEncrypt(input: string): Buffer {
	return Buffer.from(`v11${input}`, 'utf-8')
}

function fakeDecrypt(input: Buffer): {
	result: string
	shouldReEncrypt: boolean
} {
	const decoded = input.toString('utf-8')

	if (!decoded.startsWith('v11')) {
		throw new Error('Unable to decrypt: unrecognized ciphertext')
	}

	return { result: decoded.slice(3), shouldReEncrypt: false }
}

function createFakeEncryption(initial?: {
	available?: boolean
	backend?: ReturnType<SafeStorage['getSelectedStorageBackend']>
}) {
	const state = {
		available: initial?.available ?? true,
		backend: initial?.backend ?? undefined,
	}

	const encryption = {
		isAvailable: vi.fn(async () => state.available),
		getBackend: vi.fn(() => state.backend),
		encrypt: vi.fn(async (input: string) => fakeEncrypt(input)),
		decrypt: vi.fn(async (input: Buffer) => fakeDecrypt(input)),
	}

	return { encryption, state }
}
