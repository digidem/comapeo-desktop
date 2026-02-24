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
	ButtonLink,
	type ButtonLinkProps,
} from '../../../../components/link.tsx'
import { useGlobalEditingState } from '../../../../contexts/global-editing-state-store-context.ts'
import { useIconSizeBasedOnTypography } from '../../../../hooks/icon.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../lib/comapeo.ts'
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
	onEnter: ({ context, params, preload }) => {
		// NOTE: Update the active project ID whenever we navigate to a relevant project-specific page.
		if (!preload) {
			context.activeProjectIdStore.actions.update(params.projectId)
		}
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

	const navIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 1.2,
	})

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
							<ButtonLink
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
								fullWidth
								variant="text"
								color="inherit"
								size="small"
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
								aria-label={t(m.listTabLabel)}
							>
								<Icon name="noun-project-notebook" size={navIconSize} />
							</ButtonLink>
						</ListItem>

						<ListItem
							dense
							disableGutters
							disablePadding
							sx={{ justifyContent: 'center' }}
						>
							<ButtonLink
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
								fullWidth
								variant="text"
								color="inherit"
								size="small"
								inactiveProps={BASE_INACTIVE_LINK_PROPS}
								activeProps={BASE_ACTIVE_LINK_PROPS}
								aria-label={t(m.teamTabLabel)}
							>
								<Icon name="material-people-filled" size={navIconSize} />
							</ButtonLink>
						</ListItem>

						{isCoordinator ? (
							<ListItem
								dense
								disableGutters
								disablePadding
								sx={{ justifyContent: 'center' }}
							>
								<ButtonLink
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
									fullWidth
									variant="text"
									color="inherit"
									size="small"
									inactiveProps={BASE_INACTIVE_LINK_PROPS}
									activeProps={BASE_ACTIVE_LINK_PROPS}
									aria-label={t(m.toolsTabLabel)}
								>
									<Icon
										name="material-manage-accounts-filled"
										size={navIconSize}
									/>
								</ButtonLink>
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
								<ButtonLink
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
									fullWidth
									variant="text"
									color="inherit"
									size="small"
									inactiveProps={BASE_INACTIVE_LINK_PROPS}
									activeProps={BASE_ACTIVE_LINK_PROPS}
									aria-label={t(m.exchangeTabLabel)}
								>
									<Icon
										name="material-offline-bolt-filled"
										size={navIconSize}
									/>
								</ButtonLink>
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
		aspectRatio: 1,
		borderRadius: 2,
		color: DARK_GREY,
	},
} satisfies ButtonLinkProps['inactiveProps']

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
} satisfies ButtonLinkProps['activeProps']

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
