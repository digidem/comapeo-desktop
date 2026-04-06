import * as v from 'valibot'

export const AppUsageMetricsSchema = v.intersect([
	v.variant('status', [
		v.object({
			status: v.literal('enabled'),
		}),
		v.object({
			status: v.literal('disabled'),
			fromReset: v.boolean(),
		}),
	]),
	v.object({
		askCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
		updatedAt: v.pipe(v.number(), v.integer()),
	}),
])

export type AppUsageMetrics = v.InferOutput<typeof AppUsageMetricsSchema>
