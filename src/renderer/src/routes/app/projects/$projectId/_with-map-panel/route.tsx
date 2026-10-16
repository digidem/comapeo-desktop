import { Suspense } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { ErrorBoundary } from '@sentry/react'
import {
	Outlet,
	createFileRoute,
	useChildMatches,
	useSearch,
} from '@tanstack/react-router'
import { endOfToday } from 'date-fns'
import * as v from 'valibot'

import { TwoPanelLayout } from '../../-shared/two-panel-layout.tsx'
import { BLACK_00 } from '../../../../../../../shared/colors.ts'
import { GenericRouteErrorComponent } from '../../../../../components/generic-route-error-component.tsx'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../../lib/comapeo.ts'
import {
	getItem,
	removeItem,
	setItem,
} from '../../../../../lib/local-storage.ts'
import { MapPanel } from './-map-panel.tsx'
import {
	DateSearchParamsSchema,
	dateFilterToSearchParams,
	dateSearchParamsToFilter,
} from './-shared.ts'

const SearchParamsSchema = v.fallback(
	v.intersect([
		v.object({ categories: v.optional(v.array(v.string())) }),
		v.fallback(DateSearchParamsSchema, {}),
	]),
	{},
)

export const Route = createFileRoute(
	'/app/projects/$projectId/_with-map-panel',
)({
	validateSearch: SearchParamsSchema,
	beforeLoad: ({ cause, params, search }) => {
		if (cause === 'enter') {
			let routeHasNoSearchFilters = true

			if (search?.categories) {
				routeHasNoSearchFilters = false
			} else if ('period' in search) {
				routeHasNoSearchFilters = false
			} else if ('start' in search) {
				routeHasNoSearchFilters = false
			}

			if (routeHasNoSearchFilters) {
				const categoriesFilter =
					getItem('filters/categories', params.projectId) ?? undefined
				const dateFilter =
					getItem('filters/date', params.projectId) ?? undefined

				if (categoriesFilter || dateFilter) {
					throw Route.redirect({
						replace: true,
						search: (prev) => {
							return {
								...prev,
								...(dateFilter
									? dateFilterToSearchParams(dateFilter)
									: undefined),
								categories: categoriesFilter,
							}
						},
					})
				}
			}

			// NOTE: Update local storage using the values (or lack thereof from the route's search params)

			// TODO: Filter out irrelevant categories first?
			if (search.categories) {
				setItem('filters/categories', search.categories, params.projectId)
			} else {
				removeItem('filters/categories', params.projectId)
			}

			const updatedDateFilter = dateSearchParamsToFilter(search)

			if (updatedDateFilter) {
				setItem('filters/date', updatedDateFilter, params.projectId)
			} else {
				removeItem('filters/date', params.projectId)
			}
		}
	},
	loader: async ({ context, params }) => {
		const {
			projectApi,
			queryClient,
			localeState: { value: lang },
		} = context
		const { projectId } = params

		await Promise.all([
			queryClient.query({
				staleTime: 'static',
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'observation',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.observation.getMany({ lang })
				},
			}),
			queryClient.query({
				staleTime: 'static',
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'track',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.track.getMany({ lang })
				},
			}),
			queryClient.query({
				staleTime: 'static',
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'preset',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.preset.getMany({ lang })
				},
			}),
		])

		return { todayDate: endOfToday() }
	},
	component: RouteComponent,
})

function RouteComponent() {
	const projectId = Route.useParams({
		select: (value) => {
			return value.projectId
		},
	})

	return (
		<TwoPanelLayout
			start={<Outlet />}
			end={
				<ErrorBoundary
					fallback={({ error, resetError }) => (
						<GenericRouteErrorComponent
							error={
								Error.isError(error)
									? error
									: new Error('Failed to render map', { cause: error })
							}
							reset={resetError}
						/>
					)}
				>
					<Suspense
						fallback={
							<Box
								sx={{
									background: BLACK_00,
									display: 'grid',
									flex: 1,
									placeItems: 'center',
									opacity: 0.5,
								}}
							>
								<CircularProgress />
							</Box>
						}
					>
						<RouteAwareMapPanel projectId={projectId} />
					</Suspense>
				</ErrorBoundary>
			}
		/>
	)
}

function RouteAwareMapPanel({ projectId }: { projectId: string }) {
	const todayDate = Route.useLoaderData({
		select: (data) => {
			return data.todayDate
		},
	})

	const categoriesFilterFromSearch = useSearch({
		from: '/app/projects/$projectId/_with-map-panel',
		select: (value) => {
			// TODO: Filter out and warn about irrelevant categories?
			return value?.categories
		},
		shouldThrow: false,
	})

	const dateFilterFromSearch = useSearch({
		from: '/app/projects/$projectId/_with-map-panel',
		select: (value) => {
			return dateSearchParamsToFilter(value)
		},
		shouldThrow: false,
	})

	// Highlighting should occur under the following scenarios:
	// 1. A specific observation's page is being viewed.
	// 2. A specific track's page is being viewed.
	const documentToHighlight = useChildMatches({
		select: (matches) => {
			const currentRoute = matches.at(-1)!

			if (
				'trackDocId' in currentRoute.params &&
				typeof currentRoute.params.trackDocId === 'string'
			) {
				return {
					type: 'track' as const,
					docId: currentRoute.params.trackDocId,
					from: 'list' as const,
				}
			}

			if (
				'observationDocId' in currentRoute.params &&
				typeof currentRoute.params.observationDocId === 'string'
			) {
				return {
					type: 'observation' as const,
					docId: currentRoute.params.observationDocId,
					from: 'list' as const,
				}
			}

			return undefined
		},
	})

	const isDocumentIndexRoute = useChildMatches({
		select: (matches) => {
			const currentRoute = matches.at(-1)!

			return (
				currentRoute.fullPath ===
					'/app/projects/$projectId/observations/$observationDocId/' ||
				currentRoute.fullPath === '/app/projects/$projectId/tracks/$trackDocId/'
			)
		},
	})

	return (
		<MapPanel
			categoriesFilter={categoriesFilterFromSearch}
			dateFilter={dateFilterFromSearch}
			documentToHighlight={documentToHighlight}
			filterReferenceDate={todayDate}
			isDocumentIndexRoute={isDocumentIndexRoute}
			projectId={projectId}
		/>
	)
}
