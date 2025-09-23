export function formatIsoUtc(date: Readonly<Date>): string {
	return [
		date.getUTCFullYear().toString().padStart(4, '0'),
		(date.getUTCMonth() + 1).toString().padStart(2, '0'),
		date.getUTCDate().toString().padStart(2, '0'),
	].join('-')
}

export function beginningOfMonthUtc(date: Readonly<Date>): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}
