import { parseArgs } from 'node:util'
import ciao from '@homebridge/ciao'
import debug from 'debug'
import * as v from 'valibot'

/**
 * @import {Protocol} from '@homebridge/ciao'
 * @import {ServiceErrorMessageSchema} from '../main/validation.js'
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

service
	.advertise()
	.then(() => {
		log('Service is published')
	})
	.catch((err) => {
		log('Service failed to advertise', err)

		process.parentPort.postMessage(
			/** @satisfies {v.InferInput<typeof ServiceErrorMessageSchema>} */ ({
				type: 'error',
				error: err instanceof Error ? err : new Error(err),
			}),
		)
	})
