import crypto from 'node:crypto'

const ISO_DATE_REGEXP = /^(?<year>\d{4,})-(?<month>\d{2})-(?<day>\d{2})$/

export function parseReportDateGenerated(str: string): null | Date {
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

function parseMaybeInt(str: undefined | string): number {
	return parseInt(str || '', 10)
}

function getDaysInMonth(year: number, monthIndex: number): number {
	return new Date(year, monthIndex + 1, 0, 0).getDate()
}

export function isDateValid(date: Readonly<Date>): boolean {
	return !isNaN(date.valueOf())
}

function isSameUtcMonth(a: Readonly<Date>, b: Readonly<Date>): boolean {
	return a.getUTCMonth() === b.getUTCMonth()
}

function isSameUtcYear(a: Readonly<Date>, b: Readonly<Date>): boolean {
	return a.getUTCFullYear() === b.getUTCFullYear()
}

export function isSameUtcMonthAndYear(
	a: Readonly<Date>,
	b: Readonly<Date>,
): boolean {
	return isSameUtcMonth(a, b) && isSameUtcYear(a, b)
}

export function getMonthlyHash({
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

export class SendMetricsHttpError extends Error {
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
