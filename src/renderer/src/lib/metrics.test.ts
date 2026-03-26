import { describe, expect, test, vi } from 'vitest'

import { daysToMilliseconds } from '../../../shared/time.ts'
import { shouldShowAppUsageConsent } from './metrics.ts'

describe('shouldShowAppUsageConsent()', () => {
	test.describe('not onboarded', () => {
		test('app usage metrics not set', () => {
			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: null,
					onboardedAt: null,
				}),
			).toBe(false)
		})

		test('app usage metrics set', () => {
			const start = Date.now()

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: {
						status: 'enabled',
						updatedAt: start,
					},
					onboardedAt: null,
				}),
			).toBe(false)

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: {
						status: 'disabled',
						askCount: 0,
						updatedAt: start,
					},
					onboardedAt: null,
				}),
			).toBe(false)
		})
	})

	test.describe('onboarded', () => {
		test('app usage metrics not set', () => {
			vi.useFakeTimers()

			const start = Date.now()

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: null,
					onboardedAt: start,
				}),
			).toBe(false)

			vi.advanceTimersByTime(daysToMilliseconds(6))

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: null,
					onboardedAt: start,
				}),
			).toBe(false)

			vi.advanceTimersByTime(daysToMilliseconds(1))

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: null,
					onboardedAt: start,
				}),
			).toBe(true)

			vi.advanceTimersByTime(daysToMilliseconds(1))

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: null,
					onboardedAt: start,
				}),
			).toBe(true)
		})

		test('app usage metrics enabled', () => {
			vi.useFakeTimers()

			const start = Date.now()

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: { status: 'enabled', updatedAt: start },
					onboardedAt: start,
				}),
			).toBe(false)

			vi.advanceTimersByTime(daysToMilliseconds(120))

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: { status: 'enabled', updatedAt: start },
					onboardedAt: start,
				}),
			).toBe(false)
		})

		test('app usage metrics disabled', () => {
			vi.useFakeTimers()

			const start = Date.now()

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: {
						status: 'disabled',
						askCount: 0,
						updatedAt: start,
					},
					onboardedAt: start,
				}),
			).toBe(false)

			vi.advanceTimersByTime(daysToMilliseconds(90 - 1))

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: {
						status: 'disabled',
						askCount: 0,
						updatedAt: start,
					},
					onboardedAt: start,
				}),
			).toBe(false)

			vi.advanceTimersByTime(daysToMilliseconds(1))

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: {
						status: 'disabled',
						askCount: 0,
						updatedAt: start,
					},
					onboardedAt: start,
				}),
			).toBe(true)

			const updatedTimestamp1 = Date.now()

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: {
						status: 'disabled',
						askCount: 1,
						updatedAt: updatedTimestamp1,
					},
					onboardedAt: start,
				}),
			).toBe(false)

			vi.advanceTimersByTime(daysToMilliseconds(90))

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: {
						status: 'disabled',
						askCount: 1,
						updatedAt: updatedTimestamp1,
					},
					onboardedAt: start,
				}),
			).toBe(true)

			const updatedTimestamp2 = Date.now()

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: {
						status: 'disabled',
						askCount: 2,
						updatedAt: updatedTimestamp2,
					},
					onboardedAt: start,
				}),
			).toBe(false)

			vi.advanceTimersByTime(daysToMilliseconds(90))

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: {
						status: 'disabled',
						askCount: 2,
						updatedAt: updatedTimestamp2,
					},
					onboardedAt: start,
				}),
			).toBe(true)

			const updatedTimestamp3 = Date.now()

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: {
						status: 'disabled',
						askCount: 3,
						updatedAt: updatedTimestamp3,
					},
					onboardedAt: start,
				}),
			).toBe(false)

			vi.advanceTimersByTime(daysToMilliseconds(90))

			expect(
				shouldShowAppUsageConsent({
					appUsageMetrics: {
						status: 'disabled',
						askCount: 3,
						updatedAt: updatedTimestamp3,
					},
					onboardedAt: start,
				}),
			).toBe(false)
		})
	})
})
