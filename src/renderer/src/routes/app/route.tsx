import { useOwnRoleInProject, useSyncState } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import { useIsMutating } from '@tanstack/react-query'
import {
	Outlet,
	createFileRoute,
	redirect,
	useChildMatches,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import {
	BLUE_GREY,
	COMAPEO_BLUE,
	DARK_GREY,
	WHITE,
} from '#renderer/src/colors.ts'
import { Icon } from '#renderer/src/components/icon.tsx'
import {
	ButtonLink,
	type ButtonLinkProps,
} from '#renderer/src/components/link.tsx'
import { useGlobalEditingState } from '#renderer/src/contexts/global-editing-state-store-context.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	MEMBER_ROLE_ID,
} from '#renderer/src/lib/comapeo.ts'
import { GLOBAL_MUTATIONS_BASE_KEY } from '#renderer/src/lib/queries/global-mutations.ts'

export const Route = createFileRoute('/app')({
	beforeLoad: async ({ context, matches, preload, buildLocation }) => {
		const { activeProjectIdStore, clientApi, queryClient, history } = context

		let activeProjectId = activeProjectIdStore.instance.getState()

		if (!activeProjectId) {
			for (const m of matches) {
				// NOTE: We passively update the active project ID whenever we navigate
				// to a relevant project-specific page.
				if ('projectId' in m.params) {
					activeProjectId = m.params.projectId

					if (!preload) {
						activeProjectIdStore.actions.update(activeProjectId)
					}

					break
				}
			}
		}

		if (!activeProjectId) {
			throw new Error('Could not determine most recent project ID')
		}

		const projectApi = await queryClient.ensureQueryData({
			queryKey: [
				COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
				'projects',
				activeProjectId,
			],
			queryFn: async () => {
				return clientApi.getProject(activeProjectId)
			},
		})

		const role = await queryClient.ensureQueryData({
			queryKey: [
				COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
				'projects',
				activeProjectId,
				'role',
			],
			queryFn: async () => {
				return projectApi.$getOwnRole()
			},
		})

		// NOTE: No longer have proper access to the project.
		// Reset the active project ID state and redirect to the index route
		if (
			!(
				role.roleId === CREATOR_ROLE_ID ||
				role.roleId === COORDINATOR_ROLE_ID ||
				role.roleId === MEMBER_ROLE_ID
			)
		) {
			activeProjectIdStore.actions.update(undefined)

			// NOTE: Accounts for bug where `router.navigate()` doesn't account for hash router usage when trying to reload document
			// (https://discord.com/channels/719702312431386674/1431138480096022680)
			throw redirect({
				href: history.createHref(buildLocation({ to: '/' }).href),
				reloadDocument: true,
			})
		}

		// Redirect to project-specific "initial" page if the current route is the just /app
		if (matches.at(-1)!.fullPath === '/app') {
			throw redirect({
				to: '/app/projects/$projectId',
				params: { projectId: activeProjectId },
				replace: true,
			})
		}

		return { activeProjectId }
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const activeProjectId = Route.useRouteContext({
		select: (context) => context.activeProjectId,
	})

	const currentRoute = useChildMatches({
		select: (matches) => {
			return matches.at(-1)!
		},
	})

	const { data: role } = useOwnRoleInProject({ projectId: activeProjectId })

	const isCoordinator =
		role.roleId === CREATOR_ROLE_ID || role.roleId === COORDINATOR_ROLE_ID

	const syncState = useSyncState({ projectId: activeProjectId })
	const syncEnabled = syncState?.data.isSyncEnabled

	const pageHasEditing =
		currentRoute.routeId === '/app/settings/device-name' ||
		currentRoute.routeId === '/app/settings/coordinate-system' ||
		currentRoute.routeId === '/app/settings/language' ||
		currentRoute.routeId === '/app/projects/$projectId/settings/info' ||
		currentRoute.routeId ===
			'/app/projects/$projectId/invite/devices/$deviceId/role' ||
		currentRoute.routeId ===
			'/app/projects/$projectId/invite/devices/$deviceId/send'

	const isEditing = useGlobalEditingState().length > 0

	const someGlobalMutationIsPending =
		useIsMutating({ mutationKey: GLOBAL_MUTATIONS_BASE_KEY }) > 0

	return (
		<Box bgcolor={WHITE} height="100%">
			<Box display="grid" gridTemplateColumns="min-content 1fr" height="100%">
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
									params={{ projectId: activeProjectId }}
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
										)
											? BASE_INACTIVE_LINK_PROPS
											: BASE_ACTIVE_LINK_PROPS
									}
									aria-label={t(m.projectTabAccessibleLabel)}
								>
									<Box
										display="flex"
										justifyContent="center"
										alignItems="center"
										paddingBlock={4}
										flex={1}
									>
										<Icon name="noun-project-notebook" size={32} />
									</Box>
								</ButtonLink>
							</ListItem>

							<ListItem
								dense
								disableGutters
								disablePadding
								sx={{ justifyContent: 'center' }}
							>
								<ButtonLink
									to="/app/projects/$projectId/exchange"
									params={{ projectId: activeProjectId }}
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
									inactiveProps={BASE_INACTIVE_LINK_PROPS}
									activeProps={BASE_ACTIVE_LINK_PROPS}
									aria-label={t(m.exchangeTabAccessibleLabel)}
								>
									<Box
										display="flex"
										justifyContent="center"
										alignItems="center"
										paddingBlock={4}
										flex={1}
									>
										<Icon name="material-offline-bolt-filled" size={36} />
									</Box>
								</ButtonLink>
							</ListItem>
						</Stack>

						<Stack direction="column" gap={5}>
							<ListItem
								dense
								disableGutters
								disablePadding
								sx={{ justifyContent: 'center' }}
							>
								<ButtonLink
									to="/app/projects/$projectId/team"
									params={{ projectId: activeProjectId }}
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
									inactiveProps={BASE_INACTIVE_LINK_PROPS}
									activeProps={BASE_ACTIVE_LINK_PROPS}
								>
									<Stack
										direction="column"
										alignItems="center"
										flexWrap="wrap"
										textAlign="center"
										gap={2}
									>
										<Icon name="material-people-filled" size={36} />

										{t(m.teamTabLabel)}
									</Stack>
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
										params={{ projectId: activeProjectId }}
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
										inactiveProps={BASE_INACTIVE_LINK_PROPS}
										activeProps={BASE_ACTIVE_LINK_PROPS}
									>
										<Stack
											direction="column"
											alignItems="center"
											flexWrap="wrap"
											textAlign="center"
											gap={2}
										>
											<Icon name="material-manage-accounts-filled" size={36} />

											{t(m.toolsTabLabel)}
										</Stack>
									</ButtonLink>
								</ListItem>
							) : null}

							<ListItem
								dense
								disableGutters
								disablePadding
								sx={{ justifyContent: 'center' }}
							>
								<ButtonLink
									to="/app/settings"
									disabled={
										((pageHasEditing ||
											isEditing ||
											someGlobalMutationIsPending) &&
											!currentRoute.routeId.startsWith('/app/settings')) ||
										(currentRoute.routeId ===
											'/app/projects/$projectId/exchange/' &&
											syncEnabled)
									}
									onClick={(event) => {
										if (someGlobalMutationIsPending) {
											event.preventDefault()
										}
									}}
									fullWidth
									variant="text"
									color="inherit"
									inactiveProps={BASE_INACTIVE_LINK_PROPS}
									activeProps={BASE_ACTIVE_LINK_PROPS}
								>
									<Stack
										direction="column"
										alignItems="center"
										flexWrap="wrap"
										textAlign="center"
										gap={2}
									>
										<Icon name="material-settings" size={32} />

										{t(m.appSettingsTabLabel)}
									</Stack>
								</ButtonLink>
							</ListItem>
						</Stack>
					</List>
				</Box>

				<Box component="main" display="flex" overflow="auto">
					<Outlet />
				</Box>
			</Box>
		</Box>
	)
}

const BASE_INACTIVE_LINK_PROPS = {
	sx: {
		padding: 2,
		borderRadius: 2,
		color: DARK_GREY,
	},
} satisfies ButtonLinkProps['inactiveProps']

const BASE_ACTIVE_LINK_PROPS = {
	sx: {
		padding: 2,
		borderRadius: 2,
		color: COMAPEO_BLUE,
		background: (theme) => theme.lighten(theme.palette.primary.light, 0.5),
		'&:hover, &:focus-within': {
			background: (theme) => theme.palette.primary.light,
		},
	},
} satisfies ButtonLinkProps['activeProps']

const m = defineMessages({
	projectTabAccessibleLabel: {
		id: 'routes.app.route.projectTabAccessibleLabel',
		defaultMessage: 'View project.',
		description: 'Accessible label for project tab link in navigation.',
	},
	exchangeTabAccessibleLabel: {
		id: 'routes.app.route.exchangeTabAccessibleLabel',
		defaultMessage: 'View exchange.',
		description: 'Accessible label for exchange tab link in navigation.',
	},
	teamTabLabel: {
		id: 'routes.app.route.teamTabLabel',
		defaultMessage: 'Team',
		description: 'Label for team tab link in navigation.',
	},
	toolsTabLabel: {
		id: 'routes.app.route.toolsTabLabel',
		defaultMessage: 'Tools',
		description: 'Label for tools tab link in navigation.',
	},
	appSettingsTabLabel: {
		id: 'routes.app.route.appSettingsTabLabel',
		defaultMessage: 'Settings',
		description: 'Label for CoMapeo settings tab link in navigation.',
	},
})
