import * as v from 'valibot'

export const AppUsageMetricsSchema = v.object({
	status: v.union([v.literal('disabled'), v.literal('enabled')]),
	askCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
	updatedAt: v.pipe(v.number(), v.integer()),
})

export type AppUsageMetrics = v.InferOutput<typeof AppUsageMetricsSchema>
