import * as v from 'valibot'

export const ServiceErrorMessageSchema = v.object({
	type: v.literal('error'),
	error: v.instance(Error),
})

export type ServiceErrorMessage = v.InferInput<typeof ServiceErrorMessageSchema>
