import * as v from 'valibot'

export const CoordinateFormatSchema = v.picklist(['dd', 'dms', 'utm'])

export type CoordinateFormat = v.InferOutput<typeof CoordinateFormatSchema>
