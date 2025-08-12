import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'
import * as v from 'valibot'

import { TwoPanelLayout } from '../../-components/two-panel-layout'
import { BLACK } from '../../../../colors'
import { GenericRoutePendingComponent } from '../../../../components/generic-route-pending-component'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../lib/comapeo'
import { DisplayedDataMap } from './-displayed-data/map'

const SearchParamsSchema = v.object({
	highlightedDocument: v.optional(
		v.object({
			type: v.union([v.literal('observation'), v.literal('track')]),
			docId: v.string(),
			from: v.union([v.literal('map'), v.literal('list')]),
		}),
	),
})

export const Route = createFileRoute('/app/projects/$projectId')({
	validateSearch: SearchParamsSchema,
	beforeLoad: async ({ context, params }) => {
		const { clientApi, queryClient } = context
		const { projectId } = params

		let projectApi
		try {
			// TODO: Not ideal but requires changes in @comapeo/core-react
			projectApi = await queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects', projectId],
				queryFn: async () => {
					return clientApi.getProject(projectId)
				},
			})
		} catch {
			throw notFound()
		}

		return { projectApi }
	},
	// Accounts for queries used by the MapWithData component.
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
			// TODO: Not ideal but requires changes in @comapeo/core-react
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
			// TODO: Not ideal but requires changes in @comapeo/core-react
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
			// TODO: Not ideal but requires changes in @comapeo/core-react
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
	pendingComponent: () => {
		return (
			<TwoPanelLayout
				start={<GenericRoutePendingComponent />}
				end={
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
			/>
		)
	},
	component: RouteComponent,
})

function RouteComponent() {
	return <TwoPanelLayout start={<Outlet />} end={<DisplayedDataMap />} />
}
