import * as v from 'valibot'

export const CoordinateFormatSchema = v.union([
	v.literal('dd'),
	v.literal('dms'),
	v.literal('utm'),
])

export type CoordinateFormat = v.InferOutput<typeof CoordinateFormatSchema>
