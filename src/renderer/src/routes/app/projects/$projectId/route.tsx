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
import {
	Button,
	ClickAwayListener,
	Divider,
	IconButton,
	Popper,
	Typography,
	iconButtonClasses,
} from '@mui/material'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { captureException } from '@sentry/react'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import {
	Outlet,
	createFileRoute,
	notFound,
	useChildMatches,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import { useSpinDelay } from 'spin-delay'

import {
	BLACK,
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
	remountDeps: ({ params }) => params,
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

	const { data: members } = useManyMembers({ projectId, includeLeft: true })

	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { data: role } = useOwnRoleInProject({ projectId })

	const isCoordinator =
		role.roleId === CREATOR_ROLE_ID || role.roleId === COORDINATOR_ROLE_ID

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
				aria-label={t(m.projectNavigationAccessibleLabel)}
				sx={{ display: 'flex', overflow: 'auto' }}
			>
				<List
					dense
					disablePadding
					sx={{
						alignItems: 'stretch',
						display: 'flex',
						flexDirection: 'column',
						paddingBlock: 4,
					}}
				>
					<ListItem
						dense
						disableGutters
						disablePadding
						sx={{ justifyContent: 'center' }}
					>
						<ProjectInfoTabButton projectId={projectId} />
					</ListItem>

					<Stack
						direction="column"
						sx={{
							flex: 1,
							gap: 5,
							justifyContent: 'space-between',
							overflow: 'auto',
							paddingBlock: 5,
							scrollbarGutter: 'stable both-edges',
							scrollbarWidth: 'thin',
						}}
					>
						<Stack sx={{ gap: 5 }}>
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
										<Icon name="noun-project-notebook" size={24} />
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
										<Icon name="material-people-filled" size={24} />
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
												globalMutationsAreVisiblyPending &&
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
											<Icon name="material-manage-accounts-filled" size={24} />
										</IconButtonLink>
									</Tooltip>
								</ListItem>
							) : null}

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
											<Icon name="material-offline-bolt-filled" size={24} />
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
							<ListItem
								dense
								disableGutters
								disablePadding
								sx={{ justifyContent: 'center' }}
							>
								<Tooltip
									title={t(m.backgroundMapTabLabel)}
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
										<Icon name="material-layers-outlined" size={24} />
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
									title={t(m.settingsTabLabel)}
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
										<Icon name="material-settings" size={24} />
									</IconButtonLink>
								</Tooltip>
							</ListItem>
						</Stack>
					</Stack>

					<ListItem
						dense
						disableGutters
						disablePadding
						sx={{ justifyContent: 'center' }}
					>
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

	const popupDescribedById = useId()

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
		<ClickAwayListener
			onClickAway={() => {
				setAnchorElement(null)
			}}
		>
			<Box
				onKeyDown={(event) => {
					if (event.key === 'Escape') {
						setAnchorElement(null)
					}
				}}
			>
				<Tooltip
					id={popupDescribedById}
					title={intl.formatMessage(m.switchProjectTabLabel)}
					disableFocusListener
					disableInteractive={!!anchorElement}
					placement="right"
				>
					<IconButton
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

				<Popper
					id={popupDescribedById}
					role="dialog"
					placement="right-start"
					sx={{
						backgroundColor: WHITE,
						borderRadius: 2,
						boxShadow: (theme) => theme.shadows[5],
						display: 'flex',
						maxHeight: (theme) =>
							`calc(100% - ${TITLE_BAR_HEIGHT} - ${theme.spacing(10)})`,
						overflow: 'auto',
						zIndex: (theme) => theme.zIndex.modal - 1,
					}}
					modifiers={[
						{ name: 'offset', options: { offset: [0, 20] } },
						{ name: 'eventListeners', enabled: true },
					]}
					anchorEl={anchorElement}
					open={!!anchorElement}
				>
					<Stack direction="column" sx={{ overflow: 'auto' }}>
						<Stack
							direction="column"
							sx={{ flex: 1, gap: 4, overflow: 'auto', padding: 4 }}
						>
							<Typography sx={{ fontWeight: 500 }}>{deviceName}</Typography>

							{sortedProjects.map((p) => {
								const isCurrentProject = p.projectId === currentProjectId
								const displayedName =
									p.name || intl.formatMessage(m.unnamedProject)

								return (
									<ButtonBaseLink
										key={p.projectId}
										to="/app/projects/$projectId"
										params={{ projectId: p.projectId }}
										aria-label={intl.formatMessage(
											m.projectSwitcherCardLinkAccessibleLabel,
											{ name: displayedName },
										)}
										onClick={() => {
											setAnchorElement(null)
										}}
										sx={{
											alignItems: 'center',
											backgroundColor: p.projectColor,
											border: `2px solid ${isCurrentProject ? COMAPEO_BLUE : LIGHT_GREY}`,
											borderRadius: 2,
											gap: 2,
											justifyContent: 'flex-start',
											outlineOffset: -1,
											padding: 4,
											'&:hover, &:focus-within': {
												outline: `2px solid ${isCurrentProject ? COMAPEO_BLUE : BLUE_GREY}`,
											},
										}}
									>
										<Typography
											sx={{
												flex: 1,
												fontWeight: 500,
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												width: '20ch',
											}}
										>
											{displayedName}
										</Typography>

										{isCurrentProject ? (
											<Icon
												name="material-check-circle-rounded"
												color="primary"
											/>
										) : null}
									</ButtonBaseLink>
								)
							})}
						</Stack>

						<Box sx={{ paddingBlock: 4, paddingInline: 6 }}>
							<ButtonLink
								to="/app"
								color="inherit"
								startIcon={<Icon name="material-symbols-view-agenda" />}
								sx={{ marginInlineStart: -4 }}
								variant="text"
							>
								<Typography>
									{intl.formatMessage(m.projectSwitcherViewAllProjects)}
								</Typography>
							</ButtonLink>
						</Box>
					</Stack>
				</Popper>
			</Box>
		</ClickAwayListener>
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
		typographyVariant: 'body1',
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

	const accentColor = projectSettings.projectColor || WHITE

	const isAtLeastCoordinator =
		role.roleId === CREATOR_ROLE_ID || role.roleId === COORDINATOR_ROLE_ID

	return (
		<>
			<Tooltip
				title={
					<Typography
						variant="inherit"
						sx={{
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							overflow: 'hidden',
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
					onClick={() => {
						setShowProjectInfoDialog(true)
					}}
					sx={{ display: 'flex', flex: 1, color: BLACK, padding: 3 }}
				>
					<Box
						sx={{
							alignItems: 'center',
							aspectRatio: 1,
							backgroundColor: accentColor,
							borderRadius: '50%',
							display: 'flex',
							flex: 1,
							justifyContent: 'center',
						}}
					>
						<Typography sx={{ fontWeight: 500 }}>
							{displayedProjectName[0]}
						</Typography>
					</Box>
				</IconButton>
			</Tooltip>

			<DecentDialog fullWidth maxWidth="sm" value={showProjectInfoDialog}>
				{() => (
					<Stack direction="column" sx={{ gap: 4, padding: 4 }}>
						<Stack
							direction="column"
							sx={{
								alignItems: 'flex-start',
								backgroundColor: accentColor,
								borderRadius: 2,
								gap: 4,
								padding: 6,
							}}
						>
							<Typography
								variant="h1"
								sx={{ fontWeight: 500, overflowWrap: 'break-word' }}
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

							<Box>
								<ButtonLink
									to="/app/projects/$projectId/settings/info"
									params={{ projectId }}
									aria-disabled={selectAndImportMutation.status === 'pending'}
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
						</Stack>

						<List
							disablePadding
							sx={{
								display: 'flex',
								flexDirection: 'column',
								gap: 4,
								padding: 4,
							}}
						>
							<ListItem disableGutters disablePadding sx={{ gap: 4 }}>
								<Stack
									direction="row"
									sx={{
										alignItems: 'flex-start',
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
													fontWeight: 500,
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
													overflow: 'hidden',
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
													fontWeight: 500,
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
									sx={{ marginInlineEnd: -3 }}
									variant="text"
								>
									{intl.formatMessage(m.projectInfoViewTeam)}
								</ButtonLink>
							</ListItem>

							<Divider variant="fullWidth" />

							<ListItem disableGutters disablePadding sx={{ gap: 4 }}>
								<Stack
									direction="row"
									sx={{ alignItems: 'flex-start', flex: 1, gap: 4 }}
								>
									<Icon
										name="material-symbols-apps"
										size={projectSettingsItemIconSize}
									/>

									{projectSettings.configMetadata ? (
										<Box>
											<Typography color="textSecondary">
												<Typography
													component="span"
													variant="inherit"
													color="textPrimary"
													sx={{ fontWeight: 500 }}
												>
													{projectSettings.configMetadata.name}
												</Typography>
												{
													// eslint-disable-next-line formatjs/no-literal-string-in-jsx
													' '
												}
												{projectSettings.configMetadata.fileVersion}
											</Typography>

											<Typography color="textSecondary">
												{intl.formatMessage(m.projectInfoCategoriesCreated, {
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
												})}
											</Typography>

											<Typography color="textSecondary">
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
									) : (
										<Typography sx={{ fontWeight: 500 }}>
											{intl.formatMessage(m.fallbackCategoriesSetName)}
										</Typography>
									)}
								</Stack>

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
									sx={{ marginInlineEnd: -3 }}
								>
									{intl.formatMessage(m.projectInfoUpdateCategories)}
								</Button>
							</ListItem>
						</List>

						<Box
							sx={{
								bottom: 0,
								display: 'flex',
								flexDirection: 'row',
								justifyContent: 'center',
								position: 'sticky',
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
								sx={{ maxWidth: 400 }}
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
					<Icon name="material-auto-fix-high" size={24} />
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

const m = defineMessages({
	projectNavigationAccessibleLabel: {
		id: 'routes.app.projects.$projectId.route.projectNavigationAccessibleLabel',
		defaultMessage: 'Project navigation',
		description: 'Accessible label for project-specific navigation bar.',
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
	toolsTabLabel: {
		id: '$1.routes.app.projects.$projectId.route.toolsTabLabel',
		defaultMessage: 'Tools',
		description: 'Label for project tools tab link in navigation.',
	},
	testDataTabLabel: {
		id: 'routes.app.projects.$projectId.route.testDataTabLabel',
		defaultMessage: 'Test Data',
		description: 'Label for project test data tab link in navigation.',
	},
	backgroundMapTabLabel: {
		id: 'routes.app.projects.$projectId.route.backgroundMapTabLabel',
		defaultMessage: 'Background Map',
		description: 'Label for background map tab link in navigation.',
	},
	settingsTabLabel: {
		id: 'routes.app.projects.$projectId.route.settingsTabLabel',
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
