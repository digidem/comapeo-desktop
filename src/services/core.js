import assert from 'node:assert'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { FastifyController, MapeoManager } from '@comapeo/core'
import { createMapeoServer } from '@comapeo/ipc'
import Fastify from 'fastify'
import * as v from 'valibot'

/**
 * @import {MessagePortMain} from 'electron'
 */

// Patching due to issues with sodium-native in more recent versions of Electron due to removal of APIs that the module relies on.
// Replaces the usage of SecureBuffer in sodium's malloc with just a normal Buffer, which may have security implications.
// https://github.com/sodium-friends/sodium-native/issues/185
const require = createRequire(import.meta.url)
const sodium = require('sodium-native')

/**
 * @param {number} n
 */
// @ts-expect-error Needs patch to work
sodium.sodium_malloc = function sodium_malloc_monkey_patched(n) {
	return Buffer.alloc(n)
}
// @ts-expect-error Needs patch to work
sodium.sodium_free = function sodium_free_monkey_patched() {}

const DATABASE_MIGRATIONS_DIRECTORY = fileURLToPath(
	import.meta.resolve('@comapeo/core/drizzle'),
)

const DEFAULT_CONFIG_PATH = fileURLToPath(
	import.meta.resolve(
		'@mapeo/default-config/dist/mapeo-default-config.comapeocat',
	),
)

// TODO: Read from env or something
const MAP_ACCESS_TOKEN =
	'pk.eyJ1IjoiZGlnaWRlbSIsImEiOiJjbHgzbTU5aDYweGVwMmtwdGV1bWgxMmJ2In0.dwyVZFnVvqrCqXicHsvE6Q'
const DEFAULT_ONLINE_MAP_STYLE_URL = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11?access_token=${MAP_ACCESS_TOKEN}`

// Do not touch these!
const DB_DIR_NAME = 'sqlite-dbs'
const CORE_STORAGE_DIR_NAME = 'core-storage'
const CUSTOM_MAPS_DIR_NAME = 'maps'

const ProcessArgsSchema = v.object({
	rootKey: v.pipe(v.string(), v.hexadecimal()),
	storageDirectory: v.string(),
})

const NewClientMessageSchema = v.object({
	type: v.literal('core:new-client'),
	payload: v.object({
		clientId: v.string(),
	}),
})

/**
 * @typedef {v.InferInput<typeof ProcessArgsSchema>} ProcessArgs
 *
 * @typedef {v.InferInput<typeof NewClientMessageSchema>} NewClientMessage
 *
 * @typedef {Map<MessagePortMain, { close: () => void }>} PortToIpcMap
 *
 * @typedef {{
 * 			status: 'active'
 * 			fastifyController: FastifyController
 * 			manager: MapeoManager
 * 			servers: PortToIpcMap
 * 	  }
 * 	| {
 * 			status: 'idle'
 * 			fastifyController: null
 * 			manager: null
 * 			servers: PortToIpcMap
 * 	  }} State
 */

/** @type {State} */
let state = {
	status: 'idle',
	fastifyController: null,
	manager: null,
	servers: new Map(),
}

const { values } = parseArgs({
	strict: true,
	options: {
		rootKey: { type: 'string' },
		storageDirectory: { type: 'string' },
	},
})

const parsedProcessArgs = v.parse(ProcessArgsSchema, values)

const rootKey = Buffer.from(parsedProcessArgs.rootKey, 'hex')

assert(rootKey.byteLength === 16, 'Root key must be 16 bytes')

const { manager, fastifyController } = initializeCore({
	rootKey,
	storageDirectory: parsedProcessArgs.storageDirectory,
})

state = {
	...state,
	status: 'active',
	manager,
	fastifyController,
}

// We might get multiple clients, for instance if there are multiple windows,
// or if the main window reloads.
process.parentPort.on('message', (event) => {
	const [port] = event.ports

	assert(port)

	if (!v.is(NewClientMessageSchema, event.data)) {
		console.log(`Unrecognized message: ${JSON.stringify(event)}`)
		return
	}

	const { data } = event

	switch (data.type) {
		case 'core:new-client': {
			if (state.servers.has(port)) {
				console.log(
					`Ignoring 'core:new-client' message because message port already initialized`,
				)
				return
			}

			switch (state.status) {
				case 'idle': {
					const { manager, fastifyController } = initializeCore({
						rootKey,
						storageDirectory: parsedProcessArgs.storageDirectory,
					})

					const server = createMapeoServer(manager, new MessagePortLike(port))

					port.on('close', () => {
						server.close()
						state.servers.delete(port)
					})

					state = {
						status: 'active',
						manager,
						fastifyController,
						servers: new Map([[port, server]]),
					}
					break
				}
				case 'active': {
					const server = createMapeoServer(
						state.manager,
						new MessagePortLike(port),
					)

					port.on('close', () => {
						server.close()
						state.servers.delete(port)
					})

					state.servers.set(port, server)
					break
				}
			}

			break
		}
	}

	port.start()
})

/**
 * @param {Object} opts
 * @param {Buffer} opts.rootKey
 * @param {string} opts.storageDirectory
 *
 * @returns
 */
function initializeCore({ rootKey, storageDirectory }) {
	const databaseDirectory = path.join(storageDirectory, DB_DIR_NAME)
	const coreStorageDirectory = path.join(
		storageDirectory,
		CORE_STORAGE_DIR_NAME,
	)
	const customMapsDirectory = path.join(storageDirectory, CUSTOM_MAPS_DIR_NAME)

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
		defaultOnlineStyleUrl: DEFAULT_ONLINE_MAP_STYLE_URL,
		// TODO: Specify
		// customMapPath: undefined
	})

	// Don't await, methods that use the server will await this internally
	fastifyController.start()

	return { manager, fastifyController }
}

// Needed to account for type limitation in @comapeo/ipc: https://github.com/digidem/comapeo-ipc/blob/17e9a4e386c1bfd880f5a0f1c9f2b02ca712fe44/src/lib/sub-channel.js#L16
// Electron.MessagePortMain more closely follows Node's event listener interface, which uses on/off and addListener/removeListener
class MessagePortLike {
	/** @type {Electron.MessagePortMain} */
	#port

	/**
	 * @param {Electron.MessagePortMain} port
	 */
	constructor(port) {
		this.#port = port
	}

	/**
	 * @param {unknown} message
	 */
	postMessage(message) {
		this.#port.postMessage(message)
	}

	/**
	 * @param {'message'} event
	 * @param {() => void} listener
	 */
	addEventListener(event, listener) {
		this.#port.addListener(event, listener)
	}

	/**
	 * @param {'message'} event
	 * @param {() => void} listener
	 */
	removeEventListener(event, listener) {
		this.#port.removeListener(event, listener)
	}
}
