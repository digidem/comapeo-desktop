import {
	Suspense,
	useEffect,
	useId,
	useState,
	type MouseEventHandler,
} from 'react'
import {
	useImportProjectCategories,
	useManyMembers,
	useManyProjects,
	useOwnDeviceInfo,
	useOwnRoleInProject,
	useProjectSettings,
	useSingleProject,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton, { iconButtonClasses } from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Menu from '@mui/material/Menu'
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import {
	Outlet,
	createFileRoute,
	notFound,
	useChildMatches,
} from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import { useSpinDelay } from 'spin-delay'

import {
	BLUE_GREY,
	COMAPEO_BLUE,
	DARK_BLUE,
	LIGHT_GREY,
	WHITE,
} from '../../../../colors.ts'
import { DecentDialog } from '../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../components/error-dialog.tsx'
import { Icon } from '../../../../components/icon.tsx'
import {
	ButtonBaseLink,
	ButtonLink,
	IconButtonLink,
	type IconButtonLinkProps,
} from '../../../../components/link.tsx'
import { useIconSizeBasedOnTypography } from '../../../../hooks/icon.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	MEMBER_ROLE_ID,
} from '../../../../lib/comapeo.ts'
import { TITLE_BAR_HEIGHT } from '../../../../lib/constants.ts'
import { removeItem, setItem } from '../../../../lib/local-storage.ts'
import { selectFileMutationOptions } from '../../../../lib/queries/file-system.ts'
import {
	GLOBAL_MUTATIONS_BASE_KEY,
	createGlobalMutationsKey,
} from '../../../../lib/queries/global-mutations.ts'

export const Route = createFileRoute('/app/projects/$projectId')({
	beforeLoad: async ({ context, params }) => {
		const { clientApi, queryClient } = context
		const { projectId } = params

		let projectApi
		try {
			projectApi = await queryClient.query({
				staleTime: 'static',
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects', projectId],
				queryFn: async () => {
					return clientApi.getProject(projectId)
				},
			})
		} catch {
			throw notFound()
		}

		const role = await queryClient.query({
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
	loader: async ({ cause, context, params }) => {
		const { clientApi, projectApi, queryClient } = context
		const { projectId } = params

		if (cause !== 'preload') {
			// NOTE: Used by the initial route (`/`) to determine whether we should use
			// the persisted active project ID for redirecting when opening the app.
			setItem('use_active_project_id_for_initial_route', true)

			// NOTE: Update the active project ID whenever we navigate to a relevant project-specific page.
			context.activeProjectIdStore.actions.update(params.projectId)
		}

		await Promise.all([
			queryClient.query({
				staleTime: 'static',
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
				queryFn: async () => {
					return clientApi.getDeviceInfo()
				},
			}),
			queryClient.query({
				staleTime: 'static',
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'members',
					{ includeLeft: true },
				],
				queryFn: async () => {
					return projectApi.$member.getMany({ includeLeft: true })
				},
			}),
		])
	},
	onLeave: () => {
		removeItem('use_active_project_id_for_initial_route')
	},
	// NOTE: Prevents an OOM issue in the renderer when switching between projects.
	// https://awana-digital.sentry.io/issues/7738470652/
	remountDeps: ({ params }) => params,
	component: RouteComponent,
})

const NAV_ICON_SIZE = 24 as const

function RouteComponent() {
	const intl = useIntl()

	const { projectId } = Route.useParams()

	const currentRoute = useChildMatches({
		select: (matches) => {
			return matches.at(-1)!
		},
	})

	const { data: members } = useManyMembers({ projectId, includeLeft: true })

	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const selfIsOnlyProjectMemberEver =
		members.length === 1 && members[0]?.deviceId === ownDeviceInfo.deviceId

	const someGlobalMutationIsPending =
		useIsMutating({ mutationKey: GLOBAL_MUTATIONS_BASE_KEY }) > 0

	const globalMutationsAreVisiblyPending = useSpinDelay(
		someGlobalMutationIsPending,
		{ delay: 100 },
	)

	const { data: projectApi } = useSingleProject({ projectId })

	useEffect(() => {
		// NOTE: Enable connection to remote archives when entering a project-specific route
		projectApi.$sync.connectServers().catch(captureException)

		return () => {
			// NOTE: Disconnect from remote archives when leaving a project-specific route
			projectApi.$sync.disconnectServers().catch(captureException)
		}
	}, [projectId, projectApi])

	return (
		<Box
			sx={{
				backgroundColor: DARK_BLUE,
				flex: 1,
				display: 'grid',
				gridTemplateColumns: 'min-content 1fr',
			}}
		>
			<Box
				component="nav"
				aria-label={intl.formatMessage(m.projectNavigationAccessibleLabel)}
				sx={{ display: 'flex', overflow: 'auto' }}
			>
				<List
					sx={{
						alignItems: 'stretch',
						display: 'flex',
						flexDirection: 'column',
						paddingBlock: 4,
					}}
				>
					<ListItem sx={{ justifyContent: 'center' }}>
						<ProjectInfoTabButton projectId={projectId} />
					</ListItem>

					<Stack
						direction="column"
						sx={{
							flex: 1,
							gap: 5,
							justifyContent: 'space-between',
							overflow: 'auto',
							paddingBlock: 4,
							scrollbarGutter: 'stable both-edges',
							scrollbarWidth: 'thin',
						}}
					>
						<Stack sx={{ gap: 5 }}>
							<ListItem sx={{ justifyContent: 'center' }}>
								<Tooltip
									title={intl.formatMessage(m.listTabLabel)}
									disableFocusListener
									placement="right"
								>
									<IconButtonLink
										to="/app/projects/$projectId"
										params={{ projectId }}
										disabled={globalMutationsAreVisiblyPending}
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
										<Icon name="noun-project-notebook" size={NAV_ICON_SIZE} />
									</IconButtonLink>
								</Tooltip>
							</ListItem>

							<ListItem sx={{ justifyContent: 'center' }}>
								<Tooltip
									title={intl.formatMessage(m.teamTabLabel)}
									disableFocusListener
									placement="right"
								>
									<IconButtonLink
										to="/app/projects/$projectId/team"
										params={{ projectId }}
										disabled={
											globalMutationsAreVisiblyPending &&
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
										<Icon name="material-people-filled" size={NAV_ICON_SIZE} />
									</IconButtonLink>
								</Tooltip>
							</ListItem>

							{selfIsOnlyProjectMemberEver ? null : (
								<ListItem sx={{ justifyContent: 'center' }}>
									<Tooltip
										title={intl.formatMessage(m.exchangeTabLabel)}
										disableFocusListener
										placement="right"
									>
										<IconButtonLink
											to="/app/projects/$projectId/exchange"
											params={{ projectId }}
											disabled={
												globalMutationsAreVisiblyPending &&
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
											<Icon
												name="material-offline-bolt-filled"
												size={NAV_ICON_SIZE}
											/>
										</IconButtonLink>
									</Tooltip>
								</ListItem>
							)}

							{__APP_TYPE__ !== 'production' &&
							import.meta.env.VITE_FEATURE_TEST_DATA_UI === 'true' ? (
								<Suspense>
									<TestDataTabLink
										disabled={
											globalMutationsAreVisiblyPending &&
											currentRoute.fullPath !==
												'/app/projects/$projectId/test-data'
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

						<Stack direction="column" sx={{ gap: 5 }}>
							<ListItem sx={{ justifyContent: 'center' }}>
								<Tooltip
									title={intl.formatMessage(m.backgroundMapTabLabel)}
									disableFocusListener
									placement="right"
								>
									<IconButtonLink
										to="/app/settings/background-map"
										disabled={globalMutationsAreVisiblyPending}
										onClick={(event) => {
											if (someGlobalMutationIsPending) {
												event.preventDefault()
											}
										}}
										inactiveProps={BASE_INACTIVE_LINK_PROPS}
										activeProps={BASE_ACTIVE_LINK_PROPS}
									>
										<Icon
											name="material-layers-outlined"
											size={NAV_ICON_SIZE}
										/>
									</IconButtonLink>
								</Tooltip>
							</ListItem>

							<ListItem sx={{ justifyContent: 'center' }}>
								<Tooltip
									title={intl.formatMessage(m.settingsTabLabel)}
									disableFocusListener
									placement="right"
								>
									<IconButtonLink
										to="/app/settings"
										disabled={globalMutationsAreVisiblyPending}
										onClick={(event) => {
											if (someGlobalMutationIsPending) {
												event.preventDefault()
											}
										}}
										inactiveProps={BASE_INACTIVE_LINK_PROPS}
										activeProps={BASE_ACTIVE_LINK_PROPS}
									>
										<Icon name="material-settings" size={NAV_ICON_SIZE} />
									</IconButtonLink>
								</Tooltip>
							</ListItem>
						</Stack>
					</Stack>

					<ListItem sx={{ justifyContent: 'center' }}>
						<ProjectSwitcherButton
							currentProjectId={projectId}
							deviceName={ownDeviceInfo.name}
						/>
					</ListItem>
				</List>
			</Box>

			<Box
				component="main"
				sx={{
					backgroundColor: WHITE,
					borderStartStartRadius: 10,
					display: 'flex',
					overflow: 'auto',
				}}
			>
				<Outlet />
			</Box>
		</Box>
	)
}

function ProjectSwitcherButton({
	currentProjectId,
	deviceName,
}: {
	currentProjectId: string
	deviceName?: string
}) {
	const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null)

	const menuId = useId()

	const intl = useIntl()

	const { data: allProjects } = useManyProjects()

	const sortedProjects = allProjects
		.filter((p) => p.status === 'joined')
		.sort((p1, p2) => {
			if (p1.projectId === currentProjectId) {
				return -1
			}
			if (p2.projectId === currentProjectId) {
				return 1
			}

			return p1.createdAt < p2.createdAt ? -1 : 1
		})

	return (
		<>
			<Tooltip
				disableFocusListener
				disableInteractive={!!anchorElement}
				placement="right"
				title={intl.formatMessage(m.switchProjectTabLabel)}
			>
				<IconButton
					aria-haspopup="menu"
					aria-controls={anchorElement ? menuId : undefined}
					aria-expanded={!!anchorElement}
					onClick={(event) => {
						setAnchorElement((prev) => (prev ? null : event.currentTarget))
					}}
					sx={
						anchorElement
							? BASE_ACTIVE_LINK_PROPS.sx
							: BASE_INACTIVE_LINK_PROPS.sx
					}
				>
					<Icon name="material-symbols-shuffle" />
				</IconButton>
			</Tooltip>

			<Menu
				id={menuId}
				anchorEl={anchorElement}
				anchorOrigin={{ horizontal: 'right', vertical: 8 }}
				onClose={() => {
					setAnchorElement(null)
				}}
				open={!!anchorElement}
				slotProps={{
					list: {
						disablePadding: true,
						sx: { display: 'flex', flexDirection: 'column', overflow: 'auto' },
					},
					paper: {
						sx: {
							display: 'flex',
							flexDirection: 'column',
							maxHeight: (theme) =>
								`calc(100% - ${TITLE_BAR_HEIGHT} - ${theme.spacing(4)})`,
							overflow: 'auto',
						},
					},
				}}
				sx={{ overflow: 'auto', zIndex: (theme) => theme.zIndex.modal - 1 }}
				transformOrigin={{ horizontal: -20, vertical: 'bottom' }}
				transitionDuration={0}
			>
				<Box sx={{ padding: 4 }}>
					<Typography
						variant="heroHeader"
						sx={{ maxWidth: '25ch', textWrap: 'balance' }}
					>
						{deviceName}
					</Typography>
				</Box>

				<Stack
					direction="column"
					sx={{
						flex: 1,
						gap: 2,
						overflow: 'auto',
						paddingInline: 4,
						paddingBlock: 2,
					}}
				>
					{sortedProjects.map((p) => {
						const isCurrentProject = p.projectId === currentProjectId

						const displayedName = p.name || intl.formatMessage(m.unnamedProject)
						const displayedProjectColor = p.projectColor || WHITE

						const selectedClass = `&.${menuItemClasses.selected}`
						const interactedClass = `&:hover, &.${menuItemClasses.focusVisible}, &.${menuItemClasses.selected}:hover, &.${menuItemClasses.selected}.${menuItemClasses.focusVisible}`

						return (
							<MenuItem
								key={p.projectId}
								component={ButtonBaseLink}
								to="/app/projects/$projectId"
								params={{ projectId: p.projectId }}
								disableGutters
								disableRipple
								selected={isCurrentProject}
								sx={{
									backgroundColor: displayedProjectColor,
									borderRadius: 2,
									gap: 2,
									justifyContent: 'space-between',
									outline: `2px solid ${LIGHT_GREY}`,
									outlineOffset: -1,
									padding: 4,
									[selectedClass]: {
										backgroundColor: displayedProjectColor,
										outlineColor: COMAPEO_BLUE,
									},
									[interactedClass]: {
										backgroundColor: displayedProjectColor,
										outlineColor: (theme) =>
											theme.darken(
												isCurrentProject ? COMAPEO_BLUE : LIGHT_GREY,
												0.1,
											),
										outlineWidth: 3,
									},
								}}
							>
								<Typography
									sx={{
										flex: 1,
										fontWeight: (theme) => theme.typography.fontWeightMedium,
										maxWidth: '25ch',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}
								>
									{displayedName}
								</Typography>

								{isCurrentProject ? (
									<Icon name="material-check-circle-rounded" color="primary" />
								) : null}
							</MenuItem>
						)
					})}
				</Stack>

				<Box sx={{ padding: 4 }}>
					<ButtonLink
						component={MenuItem}
						fullWidth
						startIcon={<Icon name="material-symbols-view-agenda" />}
						sx={{ ':hover, :focus-within': { backgroundColor: 'initial' } }}
						to="/app"
						variant="outlined"
					>
						{intl.formatMessage(m.projectSwitcherViewAllProjects)}
					</ButtonLink>
				</Box>
			</Menu>
		</>
	)
}

const SELECT_AND_IMPORT_CATEGORY_MUTATION_KEY = createGlobalMutationsKey([
	'category',
	'select-and-import',
])

function ProjectInfoTabButton({ projectId }: { projectId: string }) {
	const [showProjectInfoDialog, setShowProjectInfoDialog] = useState<
		true | null
	>(null)

	const intl = useIntl()

	const { data: projectSettings } = useProjectSettings({ projectId })

	const { data: role } = useOwnRoleInProject({ projectId })

	const projectSettingsItemIconSize = useIconSizeBasedOnTypography({
		variant: 'bodyCopy',
		multiplier: 1.2,
	})

	const selectFile = useMutation(selectFileMutationOptions())

	const importCategoriesFile = useImportProjectCategories({ projectId })

	const selectAndImportMutation = useMutation({
		mutationKey: SELECT_AND_IMPORT_CATEGORY_MUTATION_KEY,
		mutationFn: async () => {
			const fileInfo = await selectFile.mutateAsync({
				extensionFilters: ['comapeocat'],
			})

			if (!fileInfo) {
				return
			}

			return importCategoriesFile.mutateAsync({ filePath: fileInfo.path })
		},
	})

	const displayedProjectName =
		projectSettings.name || intl.formatMessage(m.unnamedProject)

	const isAtLeastCoordinator =
		role.roleId === CREATOR_ROLE_ID || role.roleId === COORDINATOR_ROLE_ID

	return (
		<>
			<Box sx={{ aspectRatio: 1, display: 'flex', flex: 1, padding: 3 }}>
				<Tooltip
					title={
						<Typography
							variant="inherit"
							sx={{
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{displayedProjectName}
						</Typography>
					}
					disableFocusListener
					placement="right"
					slotProps={{ popper: { sx: { maxWidth: '20ch' } } }}
				>
					<IconButton
						aria-haspopup="dialog"
						aria-label={intl.formatMessage(m.projectInfoTabAccessibleLabel, {
							name: displayedProjectName,
						})}
						onClick={() => {
							setShowProjectInfoDialog(true)
						}}
						sx={{
							backgroundColor: projectSettings.projectColor || WHITE,
							flex: 1,
							'&:hover': {
								backgroundColor: (theme) =>
									theme.darken(projectSettings.projectColor || WHITE, 0.1),
							},
						}}
					>
						<Typography
							color="textPrimary"
							sx={{ fontWeight: (theme) => theme.typography.fontWeightBold }}
						>
							{displayedProjectName[0]}
						</Typography>
					</IconButton>
				</Tooltip>
			</Box>

			<DecentDialog fullWidth maxWidth="sm" value={showProjectInfoDialog}>
				{() => (
					<Stack direction="column" sx={{ overflow: 'auto' }}>
						<Stack
							direction="column"
							sx={{ gap: 4, overflow: 'auto', padding: 4 }}
						>
							<Stack
								direction="column"
								sx={{
									alignItems: 'flex-start',
									backgroundColor: projectSettings.projectColor,
									border: `2px solid ${projectSettings.projectColor || BLUE_GREY}`,
									borderRadius: 2,
									gap: 4,
									padding: 6,
								}}
							>
								<Typography
									variant="heroHeader"
									sx={{ overflowWrap: 'break-word' }}
								>
									{displayedProjectName}
								</Typography>

								{projectSettings.projectDescription ? (
									<Typography
										color="textSecondary"
										sx={{ overflowWrap: 'break-word' }}
									>
										{projectSettings.projectDescription}
									</Typography>
								) : null}

								{isAtLeastCoordinator ? (
									<Box>
										<ButtonLink
											to="/app/projects/$projectId/settings/info"
											params={{ projectId }}
											aria-disabled={
												selectAndImportMutation.status === 'pending'
											}
											endIcon={
												<Icon
													aria-hidden
													name="material-arrow-back"
													sx={{ transform: 'rotate(180deg)' }}
												/>
											}
											onClick={(event) => {
												if (selectAndImportMutation.status === 'pending') {
													event.preventDefault()
													return
												}

												setShowProjectInfoDialog(null)
											}}
											variant="text"
											sx={{ marginInlineStart: -3 }}
										>
											{intl.formatMessage(m.projectInfoEditInfo)}
										</ButtonLink>
									</Box>
								) : null}
							</Stack>

							<List
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: 4,
									padding: 4,
								}}
							>
								<ListItem sx={{ gap: 4 }}>
									<Stack
										direction="row"
										sx={{
											alignItems: 'center',
											flex: 1,
											gap: 4,
											overflow: 'hidden',
										}}
									>
										{isAtLeastCoordinator ? (
											<>
												<Icon
													name="material-manage-accounts-filled"
													size={projectSettingsItemIconSize}
												/>

												<Typography
													sx={{
														fontWeight: (theme) =>
															theme.typography.fontWeightMedium,
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
													}}
												>
													{intl.formatMessage(m.projectInfoRoleCoordinator)}
												</Typography>
											</>
										) : (
											<>
												<Icon name="material-people-filled" />

												<Typography
													sx={{
														fontWeight: (theme) =>
															theme.typography.fontWeightMedium,
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
														overflow: 'hidden',
													}}
												>
													{intl.formatMessage(m.projectInfoRoleParticipant)}
												</Typography>
											</>
										)}
									</Stack>

									<ButtonLink
										to="/app/projects/$projectId/team"
										params={{ projectId }}
										aria-disabled={selectAndImportMutation.status === 'pending'}
										onClick={(event) => {
											if (selectAndImportMutation.status === 'pending') {
												event.preventDefault()
												return
											}

											setShowProjectInfoDialog(null)
										}}
										variant="text"
									>
										{intl.formatMessage(m.projectInfoViewTeam)}
									</ButtonLink>
								</ListItem>

								<Divider sx={{ borderColor: BLUE_GREY }} />

								<ListItem sx={{ gap: 4 }}>
									<Box
										sx={{
											display: 'grid',
											flex: 1,
											gap: 2,
											gridTemplateAreas: `
												"icon main action"
												". created ." 
												". added ."
											`,
											gridTemplateColumns: 'auto 1fr auto',
											gridTemplateRows: 'repeat(3, auto)',
										}}
									>
										<Box
											sx={{
												alignItems: 'center',
												display: 'flex',
												flexDirection: 'row',
												gridArea: 'icon',
											}}
										>
											<Icon
												name="material-symbols-apps"
												size={projectSettingsItemIconSize}
											/>
										</Box>

										<Box
											sx={{
												alignItems: 'center',
												display: 'flex',
												flexDirection: 'row',
												gridArea: 'main',
												overflow: 'auto',
											}}
										>
											{projectSettings.configMetadata ? (
												<Typography
													sx={{ display: 'flex', gap: 2, overflow: 'auto' }}
												>
													<Typography
														component="span"
														sx={{
															flex: 1,
															fontWeight: (theme) =>
																theme.typography.fontWeightMedium,
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															whiteSpace: 'nowrap',
														}}
														variant="inherit"
													>
														{projectSettings.configMetadata.name}
													</Typography>

													{projectSettings.configMetadata.fileVersion}
												</Typography>
											) : (
												<Typography
													sx={{
														fontWeight: (theme) =>
															theme.typography.fontWeightMedium,
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
													}}
												>
													{intl.formatMessage(m.fallbackCategoriesSetName)}
												</Typography>
											)}
										</Box>

										{isAtLeastCoordinator ? (
											<Box
												sx={{
													alignItems: 'center',
													display: 'flex',
													flexDirection: 'row',
													gridArea: 'action',
												}}
											>
												<Button
													loading={selectAndImportMutation.status === 'pending'}
													onClick={() => {
														selectAndImportMutation.mutate(undefined, {
															onError: (err) => {
																captureException(err)
															},
														})
													}}
													variant="text"
												>
													{intl.formatMessage(m.projectInfoUpdateCategories)}
												</Button>
											</Box>
										) : null}

										{projectSettings.configMetadata ? (
											<>
												<Box sx={{ gridArea: 'created' }}>
													<Typography>
														{intl.formatMessage(
															m.projectInfoCategoriesCreated,
															{
																date: (
																	<time
																		key={`${projectSettings.configMetadata.name}@${projectSettings.configMetadata.fileVersion}`}
																		dateTime={
																			projectSettings.configMetadata.buildDate
																		}
																	>
																		{intl.formatDate(
																			projectSettings.configMetadata.buildDate,
																			{
																				year: 'numeric',
																				month: 'long',
																				day: 'numeric',
																			},
																		)}
																	</time>
																),
															},
														)}
													</Typography>
												</Box>

												<Box sx={{ gridArea: 'added' }}>
													<Typography>
														{intl.formatMessage(m.projectInfoCategoriesAdded, {
															date: (
																<time
																	key={`${projectSettings.configMetadata.name}@${projectSettings.configMetadata.fileVersion}`}
																	dateTime={
																		projectSettings.configMetadata.importDate
																	}
																>
																	{intl.formatDate(
																		projectSettings.configMetadata.importDate,
																		{
																			year: 'numeric',
																			month: 'long',
																			day: 'numeric',
																		},
																	)}
																</time>
															),
														})}
													</Typography>
												</Box>
											</>
										) : null}
									</Box>
								</ListItem>
							</List>
						</Stack>

						<Box
							sx={{
								display: 'flex',
								flexDirection: 'center',
								justifyContent: 'center',
								padding: 4,
							}}
						>
							<Button
								aria-disabled={selectAndImportMutation.status === 'pending'}
								fullWidth
								onClick={() => {
									if (selectAndImportMutation.status === 'pending') {
										return
									}

									setShowProjectInfoDialog(null)
								}}
								variant="outlined"
							>
								{intl.formatMessage(m.projectInfoClose)}
							</Button>
						</Box>
					</Stack>
				)}
			</DecentDialog>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					selectAndImportMutation.status === 'error'
						? selectAndImportMutation.error
						: null
				}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							selectAndImportMutation.reset()
						}}
					/>
				)}
			</DecentDialog>
		</>
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
	const intl = useIntl()

	const { data: projects } = useManyProjects()

	if (projects.length === 0) {
		return null
	}

	return (
		<ListItem sx={{ justifyContent: 'center' }}>
			<Tooltip
				title={intl.formatMessage(m.testDataTabLabel)}
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
					<Icon name="material-auto-fix-high" size={NAV_ICON_SIZE} />
				</IconButtonLink>
			</Tooltip>
		</ListItem>
	)
}

const BASE_INACTIVE_LINK_PROPS = {
	sx: {
		aspectRatio: 1,
		borderRadius: 2,
		color: LIGHT_GREY,
		padding: 2,
		'&:hover': {
			color: WHITE,
			background: (theme) => theme.lighten(DARK_BLUE, 0.2),
		},
		[`&.${iconButtonClasses.disabled}`]: {
			color: (theme) => theme.darken(LIGHT_GREY, 0.4),
		},
	},
} satisfies IconButtonLinkProps['inactiveProps']

const BASE_ACTIVE_LINK_PROPS = {
	sx: {
		aspectRatio: 1,
		background: (theme) => theme.palette.primary.main,
		borderRadius: 2,
		color: WHITE,
		padding: 2,
		'&:hover': {
			background: (theme) => theme.darken(theme.palette.primary.main, 0.1),
		},
		[`&.${iconButtonClasses.disabled}`]: {
			color: (theme) => theme.darken(LIGHT_GREY, 0.4),
			background: (theme) => theme.darken(theme.palette.primary.main, 0.1),
		},
	},
} satisfies IconButtonLinkProps['activeProps']

const m = defineMessages<{
	readonly projectNavigationAccessibleLabel: NoMessageValues
	readonly projectInfoTabAccessibleLabel: { readonly name: MessageValue }
	readonly listTabLabel: NoMessageValues
	readonly exchangeTabLabel: NoMessageValues
	readonly teamTabLabel: NoMessageValues
	readonly testDataTabLabel: NoMessageValues
	readonly backgroundMapTabLabel: NoMessageValues
	readonly settingsTabLabel: NoMessageValues
	readonly switchProjectTabLabel: NoMessageValues
	readonly unnamedProject: NoMessageValues
	readonly fallbackCategoriesSetName: NoMessageValues
	readonly projectInfoRoleCoordinator: NoMessageValues
	readonly projectInfoRoleParticipant: NoMessageValues
	readonly projectInfoCategoriesCreated: { readonly date: MessageValue }
	readonly projectInfoCategoriesAdded: { readonly date: MessageValue }
	readonly projectInfoEditInfo: NoMessageValues
	readonly projectInfoViewTeam: NoMessageValues
	readonly projectInfoUpdateCategories: NoMessageValues
	readonly projectInfoClose: NoMessageValues
	readonly projectSwitcherCardLinkAccessibleLabel: {
		readonly name: MessageValue
	}
	readonly projectSwitcherViewAllProjects: NoMessageValues
}>({
	projectNavigationAccessibleLabel: {
		id: 'routes.app.projects.$projectId.route.projectNavigationAccessibleLabel',
		defaultMessage: 'Project navigation',
		description: 'Accessible label for project-specific navigation bar.',
	},
	projectInfoTabAccessibleLabel: {
		id: 'routes.app.projects.$projectId.route.listTabLabel',
		defaultMessage: 'Project info for {name}',
		description: 'Accessible label for project info tab button in navigation.',
	},
	listTabLabel: {
		id: '$1.routes.app.projects.$projectId.route.listTabLabel',
		defaultMessage: 'List',
		description: 'Label for project list tab link in navigation.',
	},
	exchangeTabLabel: {
		id: '$1.routes.app.projects.$projectId.route.exchangeTabLabel',
		defaultMessage: 'Exchange',
		description: 'Label for project exchange tab link in navigation.',
	},
	teamTabLabel: {
		id: '$1.routes.app.projects.$projectId.route.teamTabLabel',
		defaultMessage: 'Team',
		description: 'Label for project team tab link in navigation.',
	},
	testDataTabLabel: {
		id: 'routes.app.projects.$projectId.route.testDataTabLabel',
		defaultMessage: 'Test Data',
		description: 'Label for project test data tab link in navigation.',
	},
	backgroundMapTabLabel: {
		id: '$1.routes.app.projects.$projectId.route.backgroundMapTabLabel',
		defaultMessage: 'Background Map',
		description: 'Label for background map tab link in navigation.',
	},
	settingsTabLabel: {
		id: '$1.routes.app.projects.$projectId.route.settingsTabLabel',
		defaultMessage: 'Settings',
		description: 'Label for app settings tab link in navigation.',
	},
	switchProjectTabLabel: {
		id: '$1.routes.app.projects.$projectId.route.switchProjectTabLabel',
		defaultMessage: 'Switch Project',
		description: 'Label for project switcher tab button in navigation.',
	},
	unnamedProject: {
		id: '$1.routes.app.projects.$projectId.route.unnamedProject',
		defaultMessage: 'Unnamed Project',
		description: 'Fallback for when project is missing a name.',
	},
	fallbackCategoriesSetName: {
		id: 'routes.app.projects.$projectId.route.fallbackCategoriesSetName',
		defaultMessage: 'CoMapeo Categories',
		description:
			'Text shown when project does not use a categories set in project info dialog.',
	},
	projectInfoRoleCoordinator: {
		id: '$1.routes.app.projects.$projectId.route.projectInfoRoleCoordinator',
		defaultMessage: 'Coordinator',
		description: 'Indicates that user is a coordinator in project info dialog.',
	},
	projectInfoRoleParticipant: {
		id: '$1.routes.app.projects.$projectId.route.projectInfoRoleParticipant',
		defaultMessage: 'Participant',
		description: 'Indicates that user is a participant in project info dialog.',
	},
	projectInfoCategoriesCreated: {
		id: '$1.routes.app.projects.$projectId.route.projectInfoCategoriesCreated',
		defaultMessage: 'Created {date}',
		description:
			'Text indicating creation date of categories set in project info dialog.',
	},
	projectInfoCategoriesAdded: {
		id: '$1.routes.app.projects.$projectId.route.projectInfoCategoriesAdded',
		defaultMessage: 'Added {date}',
		description:
			'Text indicating added date of categories set in project info dialog.',
	},
	projectInfoEditInfo: {
		id: '$1.routes.app.projects.$projectId.route.projectInfoEditInfo',
		defaultMessage: 'Edit Info',
		description: 'Text for link to edit project info in project info dialog.',
	},
	projectInfoViewTeam: {
		id: '$1.routes.app.projects.$projectId.route.projectInfoViewTeam',
		defaultMessage: 'View Team',
		description: 'Text for link to view team in project info dialog.',
	},
	projectInfoUpdateCategories: {
		id: '$1.routes.app.projects.$projectId.route.projectInfoUpdateCategories',
		defaultMessage: 'Update',
		description:
			'Text for button to update categories set in project info dialog.',
	},
	projectInfoClose: {
		id: '$1.routes.app.projects.$projectId.route.projectInfoClose',
		defaultMessage: 'Close',
		description: 'Text for button to close project info dialog.',
	},
	projectSwitcherCardLinkAccessibleLabel: {
		id: 'routes.app.projects.$projectId.route.projectSwitcherCardLinkAccessibleLabel',
		defaultMessage: 'Go to project {name}.',
		description:
			'Accessible label for link in project switcher that navigates to project when clicked.',
	},
	projectSwitcherViewAllProjects: {
		id: '$1.routes.app.projects.$projectId.route.projectSwitcherViewAllProjects',
		defaultMessage: 'View All Projects',
		description:
			'Text for button in project switcher to navigate to all projects page.',
	},
})
