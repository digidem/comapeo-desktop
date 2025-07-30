import { addSeconds, intervalToDuration } from 'date-fns'

/**
 * Takes a duration in seconds and produces a string representing the duration
 * in terms of minutes and seconds.
 *
 * Does not account for durations that are an hour or longer. We currently do
 * not allow media to be that long but this should be noted for future
 * reference.
 *
 * @param durationInSeconds
 *
 * @returns Formatted duration in the form of "MM:SS"
 */
export function getFormattedDuration(durationInSeconds: number) {
	const now = Date.now()

	const duration = intervalToDuration({
		start: now,
		end: addSeconds(now, durationInSeconds),
	})

	// NOTE: Does not account for durations that are an hour or longer.
	// We currently do not allow media to be that long, but just noting this for future reference.
	const minutes = (duration.minutes?.toString() || '').padStart(2, '0')
	const seconds = (duration.seconds?.toString() || '').padStart(2, '0')

	return `${minutes}:${seconds}`
}
