import crypto from 'node:crypto'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { platform, version } from 'node:os'
import { captureException } from '@sentry/electron'
import debug from 'debug'
import { app } from 'electron'
import * as v from 'valibot'

import type { AppConfig } from '../shared/app.ts'
import type { SupportedLanguageTag } from '../shared/intl.ts'
import { MetricsScheduler } from './metrics-scheduler/index.ts'

const log = debug('comapeo:main:metrics')

const AppDiagnosticsDataSchema = v.object({
	appId: v.optional(v.string()),
	appLocale: v.string(),
	appName: v.optional(v.string()),
	country: v.optional(v.string()),
	deviceLocale: v.string(),
	nativeApplicationVersion: v.optional(v.string()),
	nativeBuildVersion: v.optional(v.string()),
	os: v.string(),
	osVersion: v.union([v.string(), v.number()]),
})

type AppDiagnosticsData = v.InferOutput<typeof AppDiagnosticsDataSchema>

// NOTE: 5 minutes
const APP_DIAGNOSTICS_SEND_INTERVAL = 5 * 1000 * 60

export function createAppDiagnosticsMetricsScheduler({
	appConfig,
	storageFilePath,
	getLocaleInfo,
	getMetricsDeviceId,
}: {
	appConfig: AppConfig
	getLocaleInfo: () => { appLocale: SupportedLanguageTag; deviceLocale: string }
	getMetricsDeviceId: () => string
	storageFilePath: string
}): MetricsScheduler<AppDiagnosticsData> {
	return new MetricsScheduler({
		generateData: (): AppDiagnosticsData => {
			const { appLocale, deviceLocale } = getLocaleInfo()

			return {
				appLocale,
				appName: app.getName(),
				deviceLocale,
				os: platform(),
				osVersion: version(),
			}
		},
		storage: {
			get: async () => {
				let content

				try {
					content = await readFile(storageFilePath, { encoding: 'utf-8' })
				} catch {
					return undefined
				}

				const result = v.safeParse(
					v.object({
						highWatermark: v.optional(v.string()),
						reports: v.array(
							v.intersect([
								v.object({ dateGenerated: v.string() }),
								AppDiagnosticsDataSchema,
							]),
						),
					}),
					JSON.parse(content),
				)

				if (!result.success) {
					return undefined
				}

				return result.output
			},
			set: async (queue) => {
				await writeFile(storageFilePath, JSON.stringify(queue))
			},
			remove: async () => {
				await rm(storageFilePath, { force: true })
			},
		},
		send: async (reports) => {
			if (
				appConfig.appType === 'development' ||
				appConfig.appType === 'internal'
			) {
				log(
					`Not sending app diagnostics report due to app type of "${appConfig.appType}"`,
				)
				return false
			}

			const { metrics } = appConfig

			try {
				if (!metrics.accessToken) {
					throw new Error('App config missing `metrics.accessToken`')
				}

				if (!metrics.diagnosticsUrl) {
					throw new Error('App config missing `metrics.diagnosticsUrl`')
				}

				const newestReportDate = parseReportDateGenerated(
					reports.at(-1)!.dateGenerated,
				)

				// NOTE: Shouldn't happen but just in case
				if (!newestReportDate) {
					throw new Error('Expected report to be generated')
				}

				const metricsDeviceId = getMetricsDeviceId()

				const monthlyDeviceHash = getMonthlyHash({
					salt: 'app diagnostics',
					metricsDeviceId,
					date:
						// We prefer the date from the newest report, not `new Date()`.
						// These will usually be the same, but it's possible for a user to
						// send metrics right at the end of the month which would generate
						// a new monthly hash, letting us track users across months.
						newestReportDate,
				})

				const body = JSON.stringify({
					data: { type: 'app diagnostics v1', monthlyDeviceHash, reports },
				})

				const response = await fetch(metrics.diagnosticsUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: metrics.accessToken,
					},
					body,
					credentials: 'omit',
				})

				if (!response.ok) {
					throw new SendMetricsHttpError({
						status: response.status,
						errorBody: await response.text(),
					})
				}

				return true
			} catch (err) {
				captureException(err)
				return false
			}
		},
		sendInterval: APP_DIAGNOSTICS_SEND_INTERVAL,
	})
}

function getMonthlyHash({
	salt,
	metricsDeviceId,
	date,
}: {
	salt: string
	metricsDeviceId: string
	date: Date
}): string {
	return crypto.hash(
		'sha512',
		`${date.getUTCFullYear()}-${date.getUTCMonth()}-${metricsDeviceId}-${salt}`,
		'hex',
	)
}

class SendMetricsHttpError extends Error {
	readonly status: number
	readonly errorBody: string
	constructor({
		status,
		errorBody,
	}: Readonly<{ status: number; errorBody: string }>) {
		super(`HTTP error sending metrics. Error message: ${errorBody}`)
		this.status = status
		this.errorBody = errorBody
	}
}

const ISO_DATE_REGEXP = /^(?<year>\d{4,})-(?<month>\d{2})-(?<day>\d{2})$/

function parseReportDateGenerated(str: string): null | Date {
	const matchGroups = str.match(ISO_DATE_REGEXP)?.groups
	if (!matchGroups) return null

	const year = parseMaybeInt(matchGroups.year)
	if (!year) return null

	const monthIndex = parseMaybeInt(matchGroups.month) - 1
	if (monthIndex < 0 || monthIndex > 11) return null

	const day = parseMaybeInt(matchGroups.day)
	if (!day || day > getDaysInMonth(year, monthIndex)) return null

	const result = new Date(
		Date.UTC(year, monthIndex, parseMaybeInt(matchGroups.day)),
	)
	return isDateValid(result) ? result : null
}

function isDateValid(date: Readonly<Date>): boolean {
	return !isNaN(date.valueOf())
}

function parseMaybeInt(str: undefined | string): number {
	return parseInt(str || '', 10)
}

function getDaysInMonth(year: number, monthIndex: number): number {
	return new Date(year, monthIndex + 1, 0, 0).getDate()
}
