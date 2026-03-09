import { Suspense, type MouseEventHandler } from 'react'
import {
	useManyMembers,
	useManyProjects,
	useOwnDeviceInfo,
	useOwnRoleInProject,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
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

import { BLUE_GREY, COMAPEO_BLUE, DARK_GREY } from '../../../../colors.ts'
import { Icon } from '../../../../components/icon.tsx'
import {
	IconButtonLink,
	type IconButtonLinkProps,
} from '../../../../components/link.tsx'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	MEMBER_ROLE_ID,
} from '../../../../lib/comapeo.ts'
import { LOCAL_STORAGE_KEYS } from '../../../../lib/constants.ts'
import { GLOBAL_MUTATIONS_BASE_KEY } from '../../../../lib/queries/global-mutations.ts'

export const Route = createFileRoute('/app/projects/$projectId')({
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

		const role = await queryClient.fetchQuery({
			queryKey: [
				COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
				'projects',
				projectId,
				'role',
			],
			queryFn: async () => {
				return projectApi.$getOwnRole()
			},
		})

		// NOTE: No longer an active member of the project, redirect to home page.
		if (
			role.roleId !== CREATOR_ROLE_ID &&
			role.roleId !== COORDINATOR_ROLE_ID &&
			role.roleId !== MEMBER_ROLE_ID
		) {
			// TODO: Display some sort of notification about this happening?
			throw Route.redirect({ to: '/app', replace: true })
		}

		return { projectApi }
	},
	loader: async ({ context, params }) => {
		const { clientApi, projectApi, queryClient } = context
		const { projectId } = params

		await Promise.all([
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
		])
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

	const someGlobalMutationIsPending =
		useIsMutating({ mutationKey: GLOBAL_MUTATIONS_BASE_KEY }) > 0

	const { data: role } = useOwnRoleInProject({ projectId })

	const isCoordinator =
		role.roleId === CREATOR_ROLE_ID || role.roleId === COORDINATOR_ROLE_ID

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
				aria-label={t(m.projectNavigationAccessibleLabel)}
			>
				<List
					dense
					disablePadding
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						paddingInline: 4,
						paddingBlock: 6,
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
								placement="right"
							>
								<IconButtonLink
									to="/app/projects/$projectId"
									params={{ projectId }}
									disabled={someGlobalMutationIsPending}
									onClick={(event) => {
										if (someGlobalMutationIsPending) {
											event.preventDefault()
										}
									}}
									inactiveProps={BASE_INACTIVE_LINK_PROPS}
									activeProps={
										// NOTE: Subroutes of the project that also live as project nav bar tab links
										currentRoute.fullPath.startsWith(
											'/app/projects/$projectId/exchange',
										) ||
										currentRoute.fullPath.startsWith(
											'/app/projects/$projectId/settings',
										) ||
										currentRoute.fullPath.startsWith(
											'/app/projects/$projectId/team',
										) ||
										currentRoute.fullPath.startsWith(
											'/app/projects/$projectId/team/invite',
										) ||
										currentRoute.fullPath ===
											'/app/projects/$projectId/test-data'
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
								placement="right"
							>
								<IconButtonLink
									to="/app/projects/$projectId/team"
									params={{ projectId }}
									disabled={
										someGlobalMutationIsPending &&
										!currentRoute.fullPath.startsWith(
											'/app/projects/$projectId/team',
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
									placement="right"
								>
									<IconButtonLink
										to="/app/projects/$projectId/settings"
										params={{ projectId }}
										disabled={
											someGlobalMutationIsPending &&
											!currentRoute.fullPath.startsWith(
												'/app/projects/$projectId/settings',
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
										<Icon name="material-manage-accounts-filled" size={32} />
									</IconButtonLink>
								</Tooltip>
							</ListItem>
						) : null}

						{__APP_TYPE__ !== 'production' &&
						import.meta.env.VITE_FEATURE_TEST_DATA_UI === 'true' ? (
							<Suspense>
								<TestDataTabLink
									disabled={
										!!(
											someGlobalMutationIsPending &&
											currentRoute.fullPath !==
												'/app/projects/$projectId/test-data'
										)
									}
									onClick={(event) => {
										if (someGlobalMutationIsPending) {
											event.preventDefault()
										}
									}}
									projectId={projectId}
								/>
							</Suspense>
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
									placement="right"
								>
									<IconButtonLink
										to="/app/projects/$projectId/exchange"
										params={{ projectId }}
										disabled={
											someGlobalMutationIsPending &&
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
				<Outlet />
			</Box>
		</Box>
	)
}

function TestDataTabLink({
	disabled,
	onClick,
	projectId,
}: {
	disabled: boolean
	onClick: MouseEventHandler<HTMLAnchorElement>
	projectId: string
}) {
	const { formatMessage: t } = useIntl()

	const { data: projects } = useManyProjects()

	if (projects.length === 0) {
		return null
	}

	return (
		<ListItem
			dense
			disableGutters
			disablePadding
			sx={{ justifyContent: 'center' }}
		>
			<Tooltip
				title={t(m.testDataTabLabel)}
				disableFocusListener
				placement="right"
			>
				<IconButtonLink
					to="/app/projects/$projectId/test-data"
					params={{ projectId }}
					disabled={disabled}
					onClick={onClick}
					inactiveProps={BASE_INACTIVE_LINK_PROPS}
					activeProps={BASE_ACTIVE_LINK_PROPS}
				>
					<Icon name="material-auto-fix-high" size={32} />
				</IconButtonLink>
			</Tooltip>
		</ListItem>
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
	projectNavigationAccessibleLabel: {
		id: 'routes.app.projects.$projectId.route.projectNavigationAccessibleLabel',
		defaultMessage: 'Project navigation',
		description: 'Accessible label for project-specific navigation bar.',
	},
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
	testDataTabLabel: {
		id: 'routes.app.projects.$projectId.route.testDataTabLabel',
		defaultMessage: 'Test Data',
		description: 'Label for project test data tab link in navigation.',
	},
})
