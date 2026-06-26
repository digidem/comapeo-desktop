import { Suspense } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import {
	Outlet,
	createFileRoute,
	useChildMatches,
	useSearch,
} from '@tanstack/react-router'

import { TwoPanelLayout } from '../../../-components/two-panel-layout.tsx'
import { BLACK, LIGHT_GREY } from '../../../../../colors.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../../lib/comapeo.ts'
import { MapPanel } from './-map-panel.tsx'
import { type HighlightedDocument } from './-shared.ts'

export const Route = createFileRoute('/app/projects/$projectId/_main-tabs')({
	loader: async ({ context, params }) => {
		const {
			projectApi,
			queryClient,
			localeState: { value: lang },
		} = context
		const { projectId } = params

		await Promise.all([
			queryClient.ensureQueryData({
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
			queryClient.ensureQueryData({
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
			queryClient.ensureQueryData({
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
	},
	component: RouteComponent,
})

function RouteComponent() {
	const projectId = Route.useParams({
		select: (value) => {
			return value.projectId
		},
	})

	const currentRoute = useChildMatches({
		select: (matches) => {
			return matches.at(-1)!
		},
	})

	const showMapPanel =
		currentRoute.fullPath === '/app/projects/$projectId/' ||
		currentRoute.fullPath === '/app/projects/$projectId/download' ||
		currentRoute.fullPath.startsWith('/app/projects/$projectId/observations') ||
		currentRoute.fullPath.startsWith('/app/projects/$projectId/tracks')

	return (
		<TwoPanelLayout
			start={<Outlet />}
			end={
				showMapPanel ? (
					<Suspense
						fallback={
							<Box
								sx={{
									display: 'flex',
									flex: 1,
									justifyContent: 'center',
									alignItems: 'center',
									bgcolor: BLACK,
									opacity: 0.5,
								}}
							>
								<CircularProgress />
							</Box>
						}
					>
						<RouteAwareMapPanel projectId={projectId} />
					</Suspense>
				) : (
					<Box sx={{ bgcolor: LIGHT_GREY, display: 'flex', flex: 1 }} />
				)
			}
		/>
	)
}

function RouteAwareMapPanel({ projectId }: { projectId: string }) {
	const categoriesFilter = useSearch({
		from: '/app/projects/$projectId/_main-tabs/',
		select: (value) => {
			// TODO: Filter out and warn about irrelevant categories?
			return value?.filters?.categories
		},
		shouldThrow: false,
	})

	const dateFilter = useSearch({
		from: '/app/projects/$projectId/_main-tabs/',
		select: (value) => {
			return value?.filters?.date
		},
		shouldThrow: false,
	})

	const documentFromRouteParams: HighlightedDocument | undefined =
		useChildMatches({
			select: (matches) => {
				for (const m of matches) {
					if (
						m.fullPath ===
							'/app/projects/$projectId/observations/$observationDocId/' ||
						m.fullPath ===
							'/app/projects/$projectId/observations/$observationDocId/attachments/$driveId/$type/$variant/$name'
					) {
						return {
							type: 'observation' as const,
							docId: m.params.observationDocId,
							from: 'list' as const,
						}
					}

					if (m.fullPath === '/app/projects/$projectId/tracks/$trackDocId/') {
						return {
							type: 'track' as const,
							docId: m.params.trackDocId,
							from: 'list' as const,
						}
					}
				}

				return undefined
			},
		})

	const documentFromSearchParams = useSearch({
		from: '/app/projects/$projectId/_main-tabs/',
		select: (value) => {
			return value?.highlightedDocument
		},
		shouldThrow: false,
	})

	// Highlighting should occur under the following scenarios:
	// 1. A feature on the map while on the main project page is hovered over.
	// 2. A feature on the map while on the main project page is clicked on.
	// 3. An observation or track in the list on the main project page is hovered over.
	// 4. An observation or track in the list on the main project page is clicked on.
	// 5. A specific observation's page is being viewed.
	// 6. A specific track's page is being viewed.
	const documentToHighlight =
		documentFromRouteParams || documentFromSearchParams

	const { allowHighlightedDocumentMarker, isDocumentRoute } = useChildMatches({
		select: (matches) => {
			const currentRoute = matches.at(-1)!

			return {
				allowHighlightedDocumentMarker:
					currentRoute.fullPath === '/app/projects/$projectId/' ||
					currentRoute.fullPath ===
						'/app/projects/$projectId/observations/$observationDocId/' ||
					currentRoute.fullPath ===
						'/app/projects/$projectId/observations/$observationDocId/attachments/$driveId/$type/$variant/$name',
				isDocumentRoute:
					currentRoute.fullPath ===
						'/app/projects/$projectId/observations/$observationDocId/' ||
					currentRoute.fullPath ===
						'/app/projects/$projectId/tracks/$trackDocId/',
			}
		},
	})

	return (
		<MapPanel
			allowHighlightedDocumentMarker={allowHighlightedDocumentMarker}
			categoriesFilter={categoriesFilter}
			dateFilter={dateFilter}
			documentToHighlight={documentToHighlight}
			isDocumentRoute={isDocumentRoute}
			projectId={projectId}
		/>
	)
}
