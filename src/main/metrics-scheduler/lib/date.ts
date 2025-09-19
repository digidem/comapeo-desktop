const ISO_DATE_REGEXP = /^(?<year>\d{4,})-(?<month>\d{2})-(?<day>\d{2})$/

export const isDateValid = (date: Readonly<Date>): boolean =>
	!isNaN(date.valueOf())

export function formatIsoUtc(date: Readonly<Date>): string {
	return [
		date.getUTCFullYear().toString().padStart(4, '0'),
		(date.getUTCMonth() + 1).toString().padStart(2, '0'),
		date.getUTCDate().toString().padStart(2, '0'),
	].join('-')
}

const parseMaybeInt = (str: undefined | string): number =>
	parseInt(str || '', 10)

const getDaysInMonth = (year: number, monthIndex: number): number =>
	new Date(year, monthIndex + 1, 0, 0).getDate()

export const parseIsoUtc = (str: string): null | Date => {
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

export function beginningOfMonthUtc(date: Readonly<Date>): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}
