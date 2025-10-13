import { notFound, type NotFoundError } from '@tanstack/react-router'
import * as v from 'valibot'

export const CustomNotFoundDataSchema = v.object({
	message: v.string(),
})

type CustomNotFoundData = v.InferInput<typeof CustomNotFoundDataSchema>

export function customNotFound(
	options: Omit<NotFoundError, 'data'> & { data: CustomNotFoundData },
): NotFoundError {
	return notFound(options)
}
