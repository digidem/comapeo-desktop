import * as v from 'valibot'

export const AppUsageMetricsSchema = v.object({
	status: v.union([v.literal('enabled'), v.literal('disabled')]),
	updatedAt: v.number(),
	timesAsked: v.pipe(v.number(), v.minValue(1)),
})

export type AppUsageMetrics = v.InferOutput<typeof AppUsageMetricsSchema>
