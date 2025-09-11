import assert from 'node:assert'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { FastifyController, MapeoManager } from '@comapeo/core'
import { createMapeoServer } from '@comapeo/ipc/server.js'
import ciao, { type Protocol } from '@homebridge/ciao'
import debug from 'debug'
import type { MessagePortMain } from 'electron'
import Fastify from 'fastify'
import sodium from 'sodium-native'
import * as v from 'valibot'

import type { ServiceErrorMessage } from '../main/service-error.js'

const log = debug('comapeo:services:core')

// Patching due to issues with sodium-native in more recent versions of Electron due to removal of APIs that the module relies on.
// Replaces the usage of SecureBuffer in sodium's malloc with just a normal Buffer, which may have security implications.
// https://github.com/holepunchto/sodium-native/issues/185
// const sodium = require('sodium-native')

// @ts-expect-error Need patch
sodium.sodium_malloc = function sodium_malloc_monkey_patched(n: number) {
	return Buffer.alloc(n)
}

// @ts-expect-error Need patch
sodium.sodium_free = function sodium_free_monkey_patched() {}

const DATABASE_MIGRATIONS_DIRECTORY = fileURLToPath(
	import.meta.resolve('@comapeo/core/drizzle'),
)

const DEFAULT_CONFIG_PATH = fileURLToPath(
	import.meta.resolve(
		'@mapeo/default-config/dist/mapeo-default-config.comapeocat',
	),
)

// Do not touch these!
const DB_DIR_NAME = 'sqlite-dbs'
const CORE_STORAGE_DIR_NAME = 'core-storage'
const CUSTOM_MAPS_DIR_NAME = 'maps'
const DEFAULT_CUSTOM_MAP_FILE_NAME = 'default.smp'

const ProcessArgsSchema = v.object({
	onlineStyleUrl: v.optional(v.pipe(v.string(), v.url())),
	rootKey: v.pipe(
		v.string(),
		v.hexadecimal(),
		v.transform((value) => {
			return Buffer.from(value, 'hex')
		}),
		v.length(16, 'Root key must be 16 bytes'),
	),
	storageDirectory: v.string(),
})

const NewClientMessageSchema = v.object({
	type: v.literal('main:new-client'),
	payload: v.object({
		clientId: v.string(),
	}),
})

export type NewClientMessage = v.InferInput<typeof NewClientMessageSchema>

const { values } = parseArgs({
	strict: true,
	options: {
		onlineStyleUrl: { type: 'string' },
		rootKey: { type: 'string' },
		storageDirectory: { type: 'string' },
	},
})

const { onlineStyleUrl, rootKey, storageDirectory } = v.parse(
	ProcessArgsSchema,
	values,
)

const { manager } = initializeCore({
	onlineStyleUrl,
	rootKey,
	storageDirectory,
})

initializePeerDiscovery(manager).catch((err) => {
	log('Failed to start peer discovery', err)

	process.parentPort.postMessage({
		type: 'error',
		error: err instanceof Error ? err : new Error(err),
	} satisfies ServiceErrorMessage)
})

const connectedClientPorts: WeakSet<MessagePortMain> = new WeakSet()

// We might get multiple clients, for instance if there are multiple windows,
// or if the main window reloads.
process.parentPort.on('message', (event) => {
	if (!v.is(NewClientMessageSchema, event.data)) {
		log('Unrecognized message received', event)
		return
	}

	const [port] = event.ports

	assert(port)

	if (connectedClientPorts.has(port)) {
		log(
			`Ignoring '${event.data.type}' message because message port already initialized`,
		)
		return
	}

	const { clientId } = event.data.payload

	log('Adding new client', clientId)

	const server = createMapeoServer(manager, new MessagePortLike(port))

	port.on('close', () => {
		log(`Port associated with client ${clientId} closed`)
		server.close()
		connectedClientPorts.delete(port)
	})

	connectedClientPorts.add(port)

	port.start()
})

function initializeCore({
	onlineStyleUrl,
	rootKey,
	storageDirectory,
}: {
	onlineStyleUrl?: string
	rootKey: Buffer
	storageDirectory: string
}) {
	const databaseDirectory = path.join(storageDirectory, DB_DIR_NAME)
	const coreStorageDirectory = path.join(
		storageDirectory,
		CORE_STORAGE_DIR_NAME,
	)
	const customMapsDirectory = path.join(storageDirectory, CUSTOM_MAPS_DIR_NAME)

	// TODO: Namespace directories by root key (or some derivation of it?)
	mkdirSync(coreStorageDirectory, { recursive: true })
	mkdirSync(databaseDirectory, { recursive: true })
	mkdirSync(customMapsDirectory, { recursive: true })

	const fastify = Fastify()
	const fastifyController = new FastifyController({ fastify })

	const manager = new MapeoManager({
		rootKey: Buffer.from(rootKey),
		dbFolder: databaseDirectory,
		coreStorage: coreStorageDirectory,
		clientMigrationsFolder: path.join(DATABASE_MIGRATIONS_DIRECTORY, 'client'),
		projectMigrationsFolder: path.join(
			DATABASE_MIGRATIONS_DIRECTORY,
			'project',
		),
		fastify,
		defaultConfigPath: DEFAULT_CONFIG_PATH,
		defaultOnlineStyleUrl: onlineStyleUrl,
		defaultIsArchiveDevice: true,
		customMapPath: path.join(customMapsDirectory, DEFAULT_CUSTOM_MAP_FILE_NAME),
	})

	// Don't await, methods that use the server will await this internally
	fastifyController.start().catch(noop)

	return { manager, fastifyController }
}

async function initializePeerDiscovery(manager: MapeoManager) {
	const { name, port } = await manager.startLocalPeerDiscoveryServer()

	log('Started local peer discovery server')

	const responder = ciao.getResponder()

	const service = responder.createService({
		domain: 'local',
		name,
		port,
		protocol: 'tcp' as Protocol,
		type: 'comapeo',
	})

	let shutdownPromise: Promise<void> | undefined

	async function cleanup() {
		if (shutdownPromise) {
			return
		}
		log('Shutting down responder')
		// NOTE: shutdown should only be called once.
		// https://developers.homebridge.io/ciao/classes/Responder.html#shutdown
		shutdownPromise = responder.shutdown()
		await shutdownPromise
	}

	process.on('SIGTERM', cleanup)
	process.on('SIGINT', cleanup)

	await service.advertise()

	log('Advertising peer')
}

// Needed to account for type limitation in @comapeo/ipc: https://github.com/digidem/comapeo-ipc/blob/17e9a4e386c1bfd880f5a0f1c9f2b02ca712fe44/src/lib/sub-channel.js#L16
// Electron.MessagePortMain more closely follows Node's event listener interface, which uses on/off and addListener/removeListener
class MessagePortLike {
	#port: MessagePortMain

	constructor(port: MessagePortMain) {
		this.#port = port
	}

	postMessage(message: unknown) {
		this.#port.postMessage(message)
	}

	addEventListener(event: 'message', listener: () => void) {
		this.#port.addListener(event, listener)
	}

	removeEventListener(event: 'message', listener: () => void) {
		this.#port.removeListener(event, listener)
	}
}

function noop() {}
