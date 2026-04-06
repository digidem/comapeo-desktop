export function daysToMilliseconds(days: number) {
	return (
		days *
		// hours per day
		24 *
		// Minutes per hour
		60 *
		// Seconds per minute
		60 *
		// Milliseconds per second
		1000
	)
}
