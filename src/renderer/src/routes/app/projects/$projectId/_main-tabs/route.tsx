import { Suspense } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import {
	Outlet,
	createFileRoute,
	useChildMatches,
} from '@tanstack/react-router'
import * as v from 'valibot'

import { TwoPanelLayout } from '../../../-components/two-panel-layout.tsx'
import { BLACK, LIGHT_GREY } from '../../../../../colors.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../../lib/comapeo.ts'
import { MapPanel } from './-map-panel.tsx'
import { HighlightedDocumentSchema } from './-shared.ts'

const SearchParamsSchema = v.object({
	highlightedDocument: v.optional(HighlightedDocumentSchema),
})

export const Route = createFileRoute('/app/projects/$projectId/_main-tabs')({
	validateSearch: SearchParamsSchema,
	loader: async ({ context, params }) => {
		const {
			clientApi,
			projectApi,
			queryClient,
			localeState: { value: lang },
		} = context
		const { projectId } = params

		await Promise.all([
			queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'maps', 'stylejson_url'],
				queryFn: async () => {
					return clientApi.getMapStyleJsonUrl()
				},
			}),
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
								display="flex"
								flex={1}
								justifyContent="center"
								alignItems="center"
								bgcolor={BLACK}
								sx={{ opacity: 0.5 }}
							>
								<CircularProgress />
							</Box>
						}
					>
						<MapPanel />
					</Suspense>
				) : (
					<Box bgcolor={LIGHT_GREY} display="flex" flex={1} />
				)
			}
		/>
	)
}
