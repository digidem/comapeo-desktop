import { notFound, type NotFoundError } from '@tanstack/react-router'
import * as v from 'valibot'

import type { FileRouteTypes, FileRoutesByTo } from '../generated/routeTree.gen'

export type ToRoute = FileRouteTypes['to']

export type ToRouteParams<T extends ToRoute> =
	keyof FileRoutesByTo[T]['options']['params']

export type ToRouteFullPath = FileRouteTypes['fullPaths']

export type ToRouteId = FileRouteTypes['id']

export const CustomNotFoundDataSchema = v.object({
	message: v.string(),
})

export type CustomNotFoundData = v.InferInput<typeof CustomNotFoundDataSchema>

export function customNotFound(
	options: Omit<NotFoundError, 'data'> & { data: CustomNotFoundData },
): NotFoundError {
	return notFound(options)
}
