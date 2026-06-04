import * as v from 'valibot'

export const UnitSystemSchema = v.union([
	v.literal('metric'),
	v.literal('imperial'),
])

export type UnitSystem = v.InferOutput<typeof UnitSystemSchema>
