import type { AppUsageMetrics } from '../../../shared/metrics.ts'
import { daysToMilliseconds } from '../../../shared/time.ts'

export function shouldShowAppUsageConsent({
	appUsageMetrics,
	onboardedAt,
}: {
	appUsageMetrics: AppUsageMetrics | null
	onboardedAt: number | null
}): boolean {
	if (!onboardedAt) {
		return false
	}

	const now = Date.now()

	if (!appUsageMetrics) {
		return now - onboardedAt >= daysToMilliseconds(7)
	}

	if (appUsageMetrics.status === 'enabled') {
		return false
	} else {
		// NOTE: Ignore the ask count if the recorded value was from the internal reset done
		// in the persisted store implementation.
		if (appUsageMetrics.fromReset) {
			return false
		}

		if (appUsageMetrics.askCount >= 3) {
			return false
		}

		if (now - appUsageMetrics.updatedAt < daysToMilliseconds(90)) {
			return false
		}

		return true
	}
}
