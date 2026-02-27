import { Suspense } from 'react'
import {
	useManyMembers,
	useOwnDeviceInfo,
	useOwnRoleInProject,
	useSyncState,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { useIsMutating } from '@tanstack/react-query'
import {
	Outlet,
	createFileRoute,
	notFound,
	useChildMatches,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { TwoPanelLayout } from '../../-components/two-panel-layout.tsx'
import {
	BLACK,
	BLUE_GREY,
	COMAPEO_BLUE,
	DARK_GREY,
	LIGHT_GREY,
} from '../../../../colors.ts'
import { Icon } from '../../../../components/icon.tsx'
import {
	IconButtonLink,
	type IconButtonLinkProps,
} from '../../../../components/link.tsx'
import { useGlobalEditingState } from '../../../../contexts/global-editing-state-store-context.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../lib/comapeo.ts'
import { LOCAL_STORAGE_KEYS } from '../../../../lib/constants.ts'
import { GLOBAL_MUTATIONS_BASE_KEY } from '../../../../lib/queries/global-mutations.ts'
import { MapPanel } from './-map-panel.tsx'
import { HighlightedDocumentSchema } from './-shared.ts'

const SearchParamsSchema = v.object({
	highlightedDocument: v.optional(HighlightedDocumentSchema),
})

export const Route = createFileRoute('/app/projects/$projectId')({
	validateSearch: SearchParamsSchema,
	beforeLoad: async ({ context, params }) => {
		const { clientApi, queryClient } = context
		const { projectId } = params

		let projectApi
		try {
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
	loader: async ({ context, params }) => {
		const {
			clientApi,
			projectApi,
			queryClient,
			localeState: { value: lang },
		} = context
		const { projectId } = params

		const navRailQueries = [
			queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
				queryFn: async () => {
					return clientApi.getDeviceInfo()
				},
			}),
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'members',
				],
				queryFn: async () => {
					return projectApi.$member.getMany()
				},
			}),
		] as const

		const mapPanelQueries = [
			queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
				queryFn: async () => {
					return clientApi.getDeviceInfo()
				},
			}),
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'members',
				],
				queryFn: async () => {
					return projectApi.$member.getMany()
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
		] as const

		await Promise.all([...navRailQueries, ...mapPanelQueries])
	},
	onEnter: ({ context, params }) => {
		// NOTE: Used by the initial route (`/`) to determine whether we should use
		// the persisted active project ID for redirecting when opening the app.
		window.localStorage.setItem(
			LOCAL_STORAGE_KEYS.USE_ACTIVE_PROJECT_ID_FOR_INITIAL_ROUTE,
			'true',
		)

		// NOTE: Update the active project ID whenever we navigate to a relevant project-specific page.
		context.activeProjectIdStore.actions.update(params.projectId)
	},
	onLeave: () => {
		window.localStorage.removeItem(
			LOCAL_STORAGE_KEYS.USE_ACTIVE_PROJECT_ID_FOR_INITIAL_ROUTE,
		)
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const { projectId } = Route.useParams()

	const currentRoute = useChildMatches({
		select: (matches) => {
			return matches.at(-1)!
		},
	})

	const showMapPanel =
		currentRoute.routeId === '/app/projects/$projectId/' ||
		currentRoute.routeId === '/app/projects/$projectId/download' ||
		currentRoute.routeId.startsWith('/app/projects/$projectId/observations') ||
		currentRoute.routeId.startsWith('/app/projects/$projectId/tracks')

	const pageHasEditing =
		currentRoute.routeId === '/app/projects/$projectId/settings/info' ||
		currentRoute.routeId ===
			'/app/projects/$projectId/team/invite/devices/$deviceId/role' ||
		currentRoute.routeId ===
			'/app/projects/$projectId/team/invite/devices/$deviceId/send'

	const isEditing = useGlobalEditingState().length > 0

	const someGlobalMutationIsPending =
		useIsMutating({ mutationKey: GLOBAL_MUTATIONS_BASE_KEY }) > 0

	const { data: role } = useOwnRoleInProject({ projectId })

	const isCoordinator =
		role.roleId === CREATOR_ROLE_ID || role.roleId === COORDINATOR_ROLE_ID

	const syncState = useSyncState({ projectId })
	const syncEnabled = syncState?.data.isSyncEnabled

	const { data: members } = useManyMembers({ projectId })
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const selfIsOnlyProjectMemberEver =
		members.length === 1 && members[0]?.deviceId === ownDeviceInfo.deviceId

	return (
		<Box flex={1} display="grid" gridTemplateColumns="min-content 1fr">
			<Box
				component="nav"
				display="flex"
				borderRight={`2px solid ${BLUE_GREY}`}
				overflow="auto"
			>
				<List
					dense
					disablePadding
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						paddingInline: 3,
						paddingBlock: 4,
						gap: 10,
						textAlign: 'center',
						alignItems: 'stretch',
					}}
				>
					<Stack direction="column" gap={5}>
						<ListItem
							dense
							disableGutters
							disablePadding
							sx={{ justifyContent: 'center' }}
						>
							<Tooltip
								title={t(m.listTabLabel)}
								disableFocusListener
								describeChild
								placement="right"
							>
								<IconButtonLink
									to="/app/projects/$projectId"
									params={{ projectId }}
									disabled={
										pageHasEditing ||
										isEditing ||
										someGlobalMutationIsPending ||
										(syncEnabled &&
											currentRoute.routeId ===
												'/app/projects/$projectId/exchange/')
									}
									onClick={(event) => {
										if (someGlobalMutationIsPending) {
											event.preventDefault()
										}
									}}
									inactiveProps={BASE_INACTIVE_LINK_PROPS}
									activeProps={
										// NOTE: Subroutes of the project that also live as nav rail tabs
										currentRoute.routeId.startsWith(
											'/app/projects/$projectId/exchange',
										) ||
										currentRoute.routeId.startsWith(
											'/app/projects/$projectId/settings',
										) ||
										currentRoute.routeId.startsWith(
											'/app/projects/$projectId/team',
										) ||
										currentRoute.routeId.startsWith(
											'/app/projects/$projectId/team/invite',
										)
											? BASE_INACTIVE_LINK_PROPS
											: BASE_ACTIVE_LINK_PROPS
									}
								>
									<Icon name="noun-project-notebook" size={32} />
								</IconButtonLink>
							</Tooltip>
						</ListItem>

						<ListItem
							dense
							disableGutters
							disablePadding
							sx={{ justifyContent: 'center' }}
						>
							<Tooltip
								title={t(m.teamTabLabel)}
								disableFocusListener
								describeChild
								placement="right"
							>
								<IconButtonLink
									to="/app/projects/$projectId/team"
									params={{ projectId }}
									disabled={
										((pageHasEditing ||
											isEditing ||
											someGlobalMutationIsPending) &&
											!currentRoute.routeId.startsWith(
												'/app/projects/$projectId/team',
											)) ||
										(syncEnabled &&
											currentRoute.routeId ===
												'/app/projects/$projectId/exchange/')
									}
									onClick={(event) => {
										if (someGlobalMutationIsPending) {
											event.preventDefault()
										}
									}}
									inactiveProps={BASE_INACTIVE_LINK_PROPS}
									activeProps={BASE_ACTIVE_LINK_PROPS}
								>
									<Icon name="material-people-filled" size={32} />
								</IconButtonLink>
							</Tooltip>
						</ListItem>

						{isCoordinator ? (
							<ListItem
								dense
								disableGutters
								disablePadding
								sx={{ justifyContent: 'center' }}
							>
								<Tooltip
									title={t(m.toolsTabLabel)}
									disableFocusListener
									describeChild
									placement="right"
								>
									<IconButtonLink
										to="/app/projects/$projectId/settings"
										params={{ projectId }}
										disabled={
											((pageHasEditing ||
												isEditing ||
												someGlobalMutationIsPending) &&
												!currentRoute.routeId.startsWith(
													'/app/projects/$projectId/settings',
												)) ||
											(syncEnabled &&
												currentRoute.routeId ===
													'/app/projects/$projectId/exchange/')
										}
										onClick={(event) => {
											if (someGlobalMutationIsPending) {
												event.preventDefault()
											}
										}}
										inactiveProps={BASE_INACTIVE_LINK_PROPS}
										activeProps={BASE_ACTIVE_LINK_PROPS}
									>
										<Icon name="material-manage-accounts-filled" size={32} />
									</IconButtonLink>
								</Tooltip>
							</ListItem>
						) : null}
					</Stack>

					<Stack direction="column" gap={5}>
						{selfIsOnlyProjectMemberEver ? null : (
							<ListItem
								dense
								disableGutters
								disablePadding
								sx={{ justifyContent: 'center' }}
							>
								<Tooltip
									title={t(m.exchangeTabLabel)}
									disableFocusListener
									describeChild
									placement="right"
								>
									<IconButtonLink
										to="/app/projects/$projectId/exchange"
										params={{ projectId }}
										disabled={
											(pageHasEditing ||
												isEditing ||
												someGlobalMutationIsPending) &&
											!currentRoute.fullPath.startsWith(
												'/app/projects/$projectId/exchange',
											)
										}
										onClick={(event) => {
											if (someGlobalMutationIsPending) {
												event.preventDefault()
											}
										}}
										inactiveProps={BASE_INACTIVE_LINK_PROPS}
										activeProps={BASE_ACTIVE_LINK_PROPS}
									>
										<Icon name="material-offline-bolt-filled" size={32} />
									</IconButtonLink>
								</Tooltip>
							</ListItem>
						)}
					</Stack>
				</List>
			</Box>

			<Box component="main" display="flex" overflow="auto">
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
			</Box>
		</Box>
	)
}

const BASE_INACTIVE_LINK_PROPS = {
	sx: {
		padding: 2,
		aspectRatio: 1,
		borderRadius: 2,
		color: DARK_GREY,
	},
} satisfies IconButtonLinkProps['inactiveProps']

const BASE_ACTIVE_LINK_PROPS = {
	sx: {
		aspectRatio: 1,
		background: (theme) => theme.lighten(theme.palette.primary.light, 0.5),
		borderRadius: 2,
		color: COMAPEO_BLUE,
		'&:hover, &:focus-within': {
			background: (theme) => theme.palette.primary.light,
		},
	},
} satisfies IconButtonLinkProps['activeProps']

const m = defineMessages({
	listTabLabel: {
		id: 'routes.app.projects.$projectId.route.listTabLabel',
		defaultMessage: 'List',
		description: 'Label for project list tab link in navigation.',
	},
	exchangeTabLabel: {
		id: 'routes.app.projects.$projectId.route.exchangeTabLabel',
		defaultMessage: 'Exchange',
		description: 'Label for project exchange tab link in navigation.',
	},
	teamTabLabel: {
		id: 'routes.app.projects.$projectId.route.teamTabLabel',
		defaultMessage: 'Team',
		description: 'Label for project team tab link in navigation.',
	},
	toolsTabLabel: {
		id: 'routes.app.projects.$projectId.route.toolsTabLabel',
		defaultMessage: 'Tools',
		description: 'Label for project tools tab link in navigation.',
	},
})
