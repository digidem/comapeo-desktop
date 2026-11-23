import * as v from 'valibot'

export const UnitSystemSchema = v.picklist(['metric', 'imperial'])

export type UnitSystem = v.InferOutput<typeof UnitSystemSchema>
