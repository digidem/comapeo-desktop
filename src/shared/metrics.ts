import * as v from 'valibot'

export const AppUsageMetricsSchema = v.variant('status', [
	v.object({
		status: v.literal('enabled'),
		updatedAt: v.pipe(v.number(), v.integer(), v.minValue(0)),
	}),
	v.object({
		status: v.literal('disabled'),
		askCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
		updatedAt: v.pipe(v.number(), v.integer(), v.minValue(0)),
	}),
])

export type AppUsageMetrics = v.InferOutput<typeof AppUsageMetricsSchema>
