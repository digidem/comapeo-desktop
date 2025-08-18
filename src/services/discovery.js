import { parseArgs } from 'node:util'
import ciao from '@homebridge/ciao'
import debug from 'debug'
import * as v from 'valibot'

/**
 * @import {Protocol} from '@homebridge/ciao'
 */

const log = debug('comapeo:services:discovery')

const ProcessArgsSchema = v.object({
	name: v.string(),
	port: v.pipe(
		v.string(),
		v.transform((value) => {
			return Number(value)
		}),
		v.integer(),
	),
})

const { values } = parseArgs({
	strict: true,
	options: {
		name: { type: 'string' },
		port: { type: 'string' },
	},
})

const { name, port } = v.parse(ProcessArgsSchema, values)

log('Process args %O', { name, port })

const responder = ciao.getResponder()

const service = responder.createService({
	domain: 'local',
	name,
	port,
	protocol: /** @type {Protocol} */ ('tcp'),
	type: 'comapeo',
})

/** @type {Promise<void> | undefined} */
let shutdownPromise

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

const NetworkChangeMessageSchema = v.object({
	type: v.literal('network-change'),
	online: v.boolean(),
})

/**
 * @typedef {v.InferInput<typeof NetworkChangeMessageSchema>} NetworkChangeMessage
 */

process.parentPort.on('message', (event) => {
	// NOTE: Ideally we could just use Electron's net module but
	// it doesn't seem to work as expected when called within a utility process
	// https://github.com/electron/electron/issues/48100
	if (v.is(NetworkChangeMessageSchema, event.data)) {
		const { online } = event.data

		log('Network change', { online })

		handleNetworkChange(online).catch((err) => {
			process.parentPort.postMessage(
				/** @satisfies {v.InferInput<typeof ServiceErrorMessageSchema>} */ {
					type: 'error',
					error: err instanceof Error ? err : new Error(err),
				},
			)
		})
	}
})

let isAdvertising = false

/**
 * @param {boolean} online
 */
async function handleNetworkChange(online) {
	if (online && !isAdvertising) {
		try {
			await service.advertise()
			log('Started advertising')
			isAdvertising = true
		} catch (err) {
			log('Failed to advertise', err)
			throw err
		}
	} else if (!online && isAdvertising) {
		try {
			await service.end()
			log('Stopped advertising')
			isAdvertising = false
		} catch (err) {
			log('Failed to stop advertising', err)
			throw err
		}
	}
}
