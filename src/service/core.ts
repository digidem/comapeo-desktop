import assert from 'assert'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import {
  FastifyController,
  MapeoManager,
  MapeoMapsFastifyPlugin,
  MapeoOfflineFallbackMapFastifyPlugin,
  MapeoStaticMapsFastifyPlugin,
} from '@mapeo/core'
import { createMapeoServer } from '@mapeo/ipc'
import Fastify from 'fastify'
import * as v from 'valibot'

// Patching due to issues with sodium-native in more recent versions of Electron due to removal of APIs that the module relies on.
// Replaces the usage of SecureBuffer in sodium's malloc with just a normal Buffer, which may have security implications.
// https://github.com/sodium-friends/sodium-native/issues/185
const require = createRequire(import.meta.url)
const sodium = require('sodium-native')
sodium.sodium_malloc = function sodium_malloc_monkey_patched(n: number) {
  return Buffer.alloc(n)
}
sodium.sodium_free = function sodium_free_monkey_patched() {}

const DATABASE_MIGRATIONS_DIRECTORY = fileURLToPath(
  import.meta.resolve('@mapeo/core/drizzle'),
)

const DEFAULT_CONFIG_PATH = fileURLToPath(
  import.meta.resolve(
    '@mapeo/default-config/dist/mapeo-default-config.mapeoconfig',
  ),
)

const FALLBACK_MAP_DIRECTORY = path.dirname(
  fileURLToPath(import.meta.resolve('mapeo-offline-map')),
)

const DEFAULT_ONLINE_MAP_STYLE_URL = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`

// Do not touch these!
const DB_DIR_NAME = 'sqlite-dbs'
const CORE_STORAGE_DIR_NAME = 'core-storage'
const STATIC_MAP_STYLES_DIR_NAME = 'styles'

const ProcessArgsSchema = v.object({
  rootKey: v.string(),
  storageDirectory: v.string(),
})

export type ProcessArgs = v.InferInput<typeof ProcessArgsSchema>

const NewClientMessageSchema = v.object({
  type: v.literal('core:new-client'),
  payload: v.object({
    clientId: v.string(),
  }),
})

export type NewClientMessage = v.InferInput<typeof NewClientMessageSchema>

type PortToIpcMap = Map<Electron.MessagePortMain, { close: () => void }>

type State =
  | {
      status: 'active'
      fastifyController: FastifyController
      manager: MapeoManager
      servers: PortToIpcMap
    }
  | {
      status: 'idle'
      fastifyController: null
      manager: null
      servers: PortToIpcMap
    }

let state: State = {
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

assert(
  values.rootKey && values.storageDirectory,
  'Must specify rootKey and storageDirectory',
)

const rootKey = Buffer.from(values.rootKey, 'hex')

assert(rootKey.byteLength === 16, 'Root key must be 16 bytes')

const { storageDirectory } = values

const { manager, fastifyController } = initializeCore({
  rootKey,
  storageDirectory,
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
            storageDirectory,
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

function initializeCore({
  rootKey,
  storageDirectory,
}: {
  rootKey: Buffer
  storageDirectory: string
}) {
  const databaseDirectory = path.join(storageDirectory, DB_DIR_NAME)
  const coreStorageDirectory = path.join(
    storageDirectory,
    CORE_STORAGE_DIR_NAME,
  )
  const staticStylesDirectory = path.join(
    storageDirectory,
    STATIC_MAP_STYLES_DIR_NAME,
  )

  mkdirSync(coreStorageDirectory, { recursive: true })
  mkdirSync(databaseDirectory, { recursive: true })
  mkdirSync(staticStylesDirectory, { recursive: true })

  const fastify = Fastify()
  const fastifyController = new FastifyController({ fastify })

  // Register maps plugins
  fastify.register(MapeoStaticMapsFastifyPlugin, {
    prefix: 'static',
    staticRootDir: staticStylesDirectory,
  })
  fastify.register(MapeoOfflineFallbackMapFastifyPlugin, {
    prefix: 'fallback',
    styleJsonPath: path.join(FALLBACK_MAP_DIRECTORY, 'style.json'),
    sourcesDir: path.join(FALLBACK_MAP_DIRECTORY, 'dist'),
  })
  fastify.register(MapeoMapsFastifyPlugin, {
    prefix: 'maps',
    defaultOnlineStyleUrl: DEFAULT_ONLINE_MAP_STYLE_URL,
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
  })

  // Don't await, methods that use the server will await this internally
  fastifyController.start()

  return { manager, fastifyController }
}

// Needed to account for type limitation in @mapeo/ipc: https://github.com/digidem/mapeo-ipc/blob/e87edfca291bcf45602f6e9a2cfce416c73d7d81/src/lib/sub-channel.js#L16
// Electron.MessagePortMain more closely follows Node's event listener interface, which uses on/off and addListener/removeListener
class MessagePortLike {
  #port: Electron.MessagePortMain

  constructor(port: Electron.MessagePortMain) {
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
