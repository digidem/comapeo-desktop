import { appendFileSync, mkdirSync } from 'node:fs'
import path, { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { FastifyController, MapeoManager } from '@comapeo/core'
import { createAppRpcServer, createMapeoServer } from '@comapeo/ipc/server.js'
import { createServer as createMapServer } from '@comapeo/map-server'
import ciao, { type Protocol } from '@homebridge/ciao'
import { KeyManager } from '@mapeo/crypto'
import * as Sentry from '@sentry/electron/utility'
import debug from 'debug'
import type { MessagePortMain } from 'electron'
import Fastify from 'fastify'
import sodium from 'sodium-native'
import * as v from 'valibot'

const { values } = parseArgs({
	strict: true,
	options: {
		logsDirectory: { type: 'string' },
		onlineStyleUrl: { type: 'string' },
		rootKey: { type: 'string' },
		storageDirectory: { type: 'string' },
	},
})

Sentry.init({
	integrations: [
		Sentry.onUncaughtExceptionIntegration({
			exitEvenIfOtherHandlersAreRegistered: true,
		}),
	],
})

process.on('uncaughtException', (error) => {
	log('uncaughtException', error)

	if (values.logsDirectory) {
		try {
			writeErrorToLogs(values.logsDirectory, error)
		} catch (reason) {
			Sentry.captureException(
				new Error('Failed to write to log file', { cause: reason }),
			)
		}
	}

	// NOTE: We let Sentry handle exiting the process in order to properly capture exceptions
})

const log = debug('comapeo:services:core')

// Patching due to issues with sodium-native in more recent versions of Electron due to removal of APIs that the module relies on.
// Replaces the usage of SecureBuffer in sodium's malloc with just a normal Buffer, which may have security implications.
// https://github.com/holepunchto/sodium-native/issues/185

// @ts-expect-error Need patch
sodium.sodium_malloc = function sodium_malloc_monkey_patched(n: number) {
	return Buffer.alloc(n)
}
// @ts-expect-error Need patch
sodium.sodium_free = function sodium_free_monkey_patched() {}

const DATABASE_MIGRATIONS_DIRECTORY = fileURLToPath(
	join(import.meta.resolve('@comapeo/core'), '../../drizzle'),
)

const DEFAULT_CONFIG_PATH = fileURLToPath(
	import.meta
		.resolve('@comapeo/default-categories/dist/comapeo-default-categories.comapeocat'),
)

const DEFAULT_FALLBACK_MAP_FILE_PATH = fileURLToPath(
	import.meta.resolve('@comapeo/fallback-smp'),
)

// Do not touch these!
const DB_DIR_NAME = 'sqlite-dbs'
const CORE_STORAGE_DIR_NAME = 'core-storage'
const CUSTOM_MAPS_DIR_NAME = 'maps'
const DEFAULT_CUSTOM_MAP_FILE_NAME = 'default.smp'

const ProcessArgsSchema = v.object({
	logsDirectory: v.string(),
	onlineStyleUrl: v.pipe(v.string(), v.url()),
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

const { onlineStyleUrl, rootKey, storageDirectory } = v.parse(
	ProcessArgsSchema,
	values,
)

const { manager, mapServer } = initializeCore({
	onlineStyleUrl,
	rootKey,
	storageDirectory,
})

initializePeerDiscovery(manager).catch((err) => {
	log('Failed to start peer discovery', err)
	Sentry.captureException(err)
})

const connectedRpcPorts: WeakSet<MessagePortMain> = new WeakSet()

// We might get multiple clients, for instance if there are multiple windows,
// or if the main window reloads.
process.parentPort.on('message', (event) => {
	if (!v.is(NewClientMessageSchema, event.data)) {
		log('Unrecognized message received', event)
		return
	}

	const [comapeoChannelPort, appChannelPort] = event.ports

	if (!comapeoChannelPort) {
		throw new Error('Expected comapeoChannelPort to be defined')
	}

	if (!appChannelPort) {
		throw new Error('Expected appChannelPort to be defined')
	}

	const { clientId } = event.data.payload

	if (connectedRpcPorts.has(comapeoChannelPort)) {
		log(
			`CoMapeo channel message port already set up for '${event.data.type}' message from client ${clientId}.`,
		)
	} else {
		const server = createMapeoServer(
			manager,
			new MessagePortLike(comapeoChannelPort),
		)

		comapeoChannelPort.on('close', () => {
			log(`CoMapeo channel port associated with client ${clientId} closed`)
			server.close()
			connectedRpcPorts.delete(comapeoChannelPort)
		})

		connectedRpcPorts.add(comapeoChannelPort)

		comapeoChannelPort.start()

		log(`Initialized comapeo rpc server for client ${clientId}`)
	}

	if (connectedRpcPorts.has(appChannelPort)) {
		log(
			`App channel message port already set up for '${event.data.type}' message from client ${clientId}.`,
		)
	} else {
		const server = createAppRpcServer(
			{ mapServer },
			new MessagePortLike(appChannelPort),
		)

		appChannelPort.on('close', () => {
			log(`App channel port associated with client ${clientId} closed`)
			server.close()
			connectedRpcPorts.delete(appChannelPort)
		})

		connectedRpcPorts.add(appChannelPort)

		appChannelPort.start()

		log(`Initialized app rpc server for client ${clientId}`)
	}
})

function initializeCore({
	onlineStyleUrl,
	rootKey,
	storageDirectory,
}: {
	onlineStyleUrl: string
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

	// NOTE: Kind of a gross hack to address CORS issues from the map server.
	fastify.addHook('onSend', async (request, reply, payload) => {
		if (request.url.startsWith('/maps')) {
			reply.header('Access-Control-Allow-Origin', '*')
		}

		return payload
	})

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

	const mapServerKeyPair = new KeyManager(rootKey).getIdentityKeypair()

	const mapServer = createMapServer({
		customMapPath: path.join(customMapsDirectory, DEFAULT_CUSTOM_MAP_FILE_NAME),
		defaultOnlineStyleUrl: onlineStyleUrl,
		fallbackMapPath: DEFAULT_FALLBACK_MAP_FILE_PATH,
		keyPair: mapServerKeyPair,
	})

	// Don't await, methods that use the server will await this internally
	fastifyController.start().catch((err) => {
		Sentry.captureException(err)
	})

	return { manager, mapServer, fastifyController }
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

function writeErrorToLogs(logsDirectory: string, error: Error) {
	const file = join(logsDirectory, 'service-core.txt')

	appendFileSync(
		file,
		`${new Date().toISOString()} ${error.stack || error.toString()}\n`,
	)
}
