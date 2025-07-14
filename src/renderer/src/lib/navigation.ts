import type { FileRouteTypes, FileRoutesByTo } from '../routeTree.gen'

export type ToRoute = FileRouteTypes['to']

export type ToRouteParams<T extends ToRoute> =
	keyof FileRoutesByTo[T]['options']['params']

export type ToRouteFullPath = FileRouteTypes['fullPaths']

export type ToRouteId = FileRouteTypes['id']
