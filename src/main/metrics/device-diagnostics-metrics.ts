import { readFile, writeFile } from 'node:fs/promises'
import { platform, totalmem } from 'node:os'
import { captureException } from '@sentry/electron'
import debug from 'debug'
import { screen } from 'electron'
import si from 'systeminformation'
import * as v from 'valibot'

import type { AppConfig } from '../../shared/app.ts'
import {
	SendMetricsHttpError,
	getMonthlyHash,
	isDateValid,
	isSameUtcMonthAndYear,
} from './utils.ts'

const log = debug('comapeo:main:metrics:device-diagnostics-metrics')

const DeviceDiagnosticsStorageSchema = v.object({
	lastSentAt: v.optional(v.number()),
})

type DeviceDiagnosticsStorage = v.InferOutput<
	typeof DeviceDiagnosticsStorageSchema
>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DeviceDiagnosticsApiSchema = v.object({
	type: v.string(),
	monthlyDeviceHash: v.string(),
	brand: v.optional(v.string()),
	deviceType: v.optional(v.string()),
	isEmulator: v.optional(v.boolean()),
	manufacturer: v.optional(v.string()),
	model: v.optional(v.string()),
	os: v.string(),
	screen: v.object({
		height: v.number(),
		width: v.number(),
		pixelRatio: v.number(),
	}),
	supportedCpuArchitectures: v.optional(v.array(v.string())),
	totalMemory: v.optional(v.number()),
})

type DeviceDiagnosticsApi = v.InferOutput<typeof DeviceDiagnosticsApiSchema>

export class DeviceDiagnosticsMetrics {
	#isEnabled = false
	#isCurrentlySendingMetrics = false

	#appConfig
	#getMetricsDeviceId
	#storageFilePath

	constructor(options: {
		appConfig: AppConfig
		getMetricsDeviceId: () => string
		storageFilePath: string
	}) {
		this.#appConfig = options.appConfig
		this.#getMetricsDeviceId = options.getMetricsDeviceId
		this.#storageFilePath = options.storageFilePath
	}

	setEnabled(isEnabled: boolean): void {
		this.#isEnabled = isEnabled
		this.#update()
	}

	async #readStorage() {
		let content: unknown

		try {
			content = JSON.parse(
				await readFile(this.#storageFilePath, { encoding: 'utf-8' }),
			)
		} catch (err) {
			captureException(err)

			return undefined
		}

		const result = v.safeParse(DeviceDiagnosticsStorageSchema, content)

		if (!result.success) {
			return undefined
		}

		return result.output
	}

	async #writeStorage() {
		const content: DeviceDiagnosticsStorage = { lastSentAt: Date.now() }

		await writeFile(this.#storageFilePath, JSON.stringify(content))
	}

	async #generateData(): Promise<DeviceDiagnosticsApi> {
		const systemData = await si.system()

		const metricsDeviceId = this.#getMetricsDeviceId()

		const display = screen.getPrimaryDisplay()

		return {
			type: 'device diagnostics v1',
			isEmulator: systemData.virtual,
			manufacturer: systemData.manufacturer,
			model: systemData.model,
			monthlyDeviceHash: getMonthlyHash({
				salt: 'device diagnostics',
				metricsDeviceId,
				date: new Date(),
			}),
			os: platform(),
			screen: {
				width: display.workAreaSize.width,
				height: display.workAreaSize.height,
				pixelRatio: display.scaleFactor,
			},
			totalMemory: totalmem(),
		}
	}

	async #update(): Promise<void> {
		if (
			this.#appConfig.appType === 'development' ||
			this.#appConfig.appType === 'internal'
		) {
			log(
				`Not sending device diagnostics due to app type of "${this.#appConfig.appType}"`,
			)
			return
		}

		try {
			const lastSentAt = new Date(
				(await this.#readStorage())?.lastSentAt ?? -Infinity,
			)

			const hasEnoughTimeElapsed =
				!isDateValid(lastSentAt) ||
				!isSameUtcMonthAndYear(lastSentAt, new Date())

			const shouldSendMetrics =
				this.#isEnabled &&
				!this.#isCurrentlySendingMetrics &&
				hasEnoughTimeElapsed

			if (!shouldSendMetrics) return

			this.#isCurrentlySendingMetrics = true

			const { metrics } = this.#appConfig

			if (!metrics.accessToken) {
				throw new Error('App config missing `metrics.accessToken`')
			}

			if (!metrics.diagnosticsUrl) {
				throw new Error('App config missing `metrics.diagnosticsUrl`')
			}

			const data = await this.#generateData()

			const response = await fetch(metrics.diagnosticsUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: metrics.accessToken,
				},
				body: JSON.stringify({ data }),
				credentials: 'omit',
			})

			if (!response.ok) {
				throw new SendMetricsHttpError({
					status: response.status,
					errorBody: await response.text(),
				})
			}

			await this.#writeStorage()
		} catch (err) {
			captureException(err)
		} finally {
			this.#isCurrentlySendingMetrics = false
		}
	}
}
