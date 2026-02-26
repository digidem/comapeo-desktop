import { Suspense, useRef } from 'react'
import {
	useAcceptInvite,
	useManyInvites,
	useRejectInvite,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Slide from '@mui/material/Slide'
import Snackbar from '@mui/material/Snackbar'
import SnackbarContent from '@mui/material/SnackbarContent'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { darken, lighten } from '@mui/material/styles'
import { captureException } from '@sentry/react'
import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import { useSpinDelay } from 'spin-delay'

import {
	BLUE_GREY,
	DARK_COMAPEO_BLUE,
	DARK_GREY,
	GREEN,
	LIGHT_GREY,
	WHITE,
} from '../../colors.ts'
import {
	DecentDialog,
	type DecentDialogRef,
} from '../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../components/error-dialog.tsx'
import { Icon } from '../../components/icon.tsx'
import {
	IconButtonLink,
	type IconButtonLinkProps,
} from '../../components/link.tsx'
import { useActiveProjectId } from '../../contexts/active-project-id-store-context.ts'
import { useGlobalEditingState } from '../../contexts/global-editing-state-store-context.ts'
import { useIconSizeBasedOnTypography } from '../../hooks/icon.ts'
import { ProjectTabButton } from './-project-tab-button.tsx'

export const Route = createFileRoute('/app')({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const activeProjectId = useActiveProjectId()

	return (
		<Box bgcolor={WHITE} height="100%">
			<Box display="grid" gridTemplateRows="auto 1fr" height="100%">
				<Stack
					component="nav"
					overflow="auto"
					direction="row"
					bgcolor={darken(DARK_COMAPEO_BLUE, 0.5)}
					height={48}
				>
					<Tooltip
						title={t(m.homeTabLabel)}
						disableFocusListener
						describeChild
						placement="bottom"
					>
						<IconButtonLink
							to="/app"
							activeOptions={{ exact: true, includeSearch: false }}
							inactiveProps={BASE_INACTIVE_LINK_PROPS}
							activeProps={BASE_ACTIVE_LINK_PROPS}
						>
							<Icon name="material-symbols-home" size={24} />
						</IconButtonLink>
					</Tooltip>

					<Divider
						orientation="vertical"
						sx={{ borderColor: TAB_DIVIDER_COLOR }}
					/>

					<Tooltip
						title={t(m.appSettingsTabLabel)}
						disableFocusListener
						describeChild
						placement="bottom"
					>
						<IconButtonLink
							to="/app/settings"
							inactiveProps={BASE_INACTIVE_LINK_PROPS}
							activeProps={BASE_ACTIVE_LINK_PROPS}
						>
							<Icon name="material-settings" size={24} />
						</IconButtonLink>
					</Tooltip>

					<Divider
						orientation="vertical"
						sx={{ borderColor: TAB_DIVIDER_COLOR }}
					/>

					<Stack direction="row" padding={2} gap={2} sx={{ overflowX: 'auto' }}>
						{activeProjectId ? (
							<ProjectTabButton projectId={activeProjectId} />
						) : null}
					</Stack>
				</Stack>

				<Box component="main" display="flex" overflow="auto">
					<Outlet />

					<Suspense>
						<ProjectInvite />
					</Suspense>
				</Box>
			</Box>
		</Box>
	)
}

function ProjectInvite() {
	const router = useRouter()

	const { formatMessage: t } = useIntl()

	const { data: invites } = useManyInvites()

	const iconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h3',
		multiplier: 2,
	})

	const rejectInvite = useRejectInvite()
	const acceptInvite = useAcceptInvite()

	const projectJoinedDialogRef = useRef<DecentDialogRef<{
		projectId: string
		projectName: string
	}> | null>(null)

	const handleInviteErrorDialogRef =
		useRef<DecentDialogRef<{ from: 'reject' | 'accept'; error: Error }>>(null)

	const pendingInvite = invites.find((i) => i.state === 'pending')

	const isEditing = useGlobalEditingState().length > 0

	const showRespondingToInviteLoader = useSpinDelay(
		rejectInvite.status === 'pending' || acceptInvite.status === 'pending',
		{ delay: 100 },
	)

	return (
		<>
			<Snackbar
				key={pendingInvite ? pendingInvite.inviteId : undefined}
				open={
					!!pendingInvite &&
					// TODO: No longer necessary once confirm-before-leaving-page functionality is introduced
					!isEditing
				}
				anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
				slots={{ transition: Slide }}
				slotProps={{
					root: {
						sx: { bottom: '0 !important', right: '0 !important' },
					},
					transition: { direction: 'up' },
					clickAwayListener: {
						onClickAway: (event) => {
							// @ts-expect-error Special MUI thing (https://mui.com/material-ui/react-snackbar/#preventing-default-click-away-event)
							event.defaultMuiPrevented = true
						},
					},
				}}
			>
				<SnackbarContent
					sx={{
						backgroundColor: WHITE,
						border: `1px solid ${LIGHT_GREY}`,
						borderRadius: 2,
					}}
					message={
						pendingInvite ? (
							<Stack direction="column" gap={2} maxWidth={400}>
								<Box>
									<Typography
										variant="body2"
										fontWeight={500}
										textTransform="uppercase"
									>
										{t(m.projectInviteTitle)}
									</Typography>
								</Box>

								<Stack
									direction="column"
									gap={6}
									borderRadius={2}
									padding={6}
									bgcolor={pendingInvite.projectColor}
									boxShadow={(theme) => theme.shadows[2]}
									border={`1px solid ${BLUE_GREY}`}
								>
									<Stack direction="column">
										<Stack direction="row" gap={3} alignItems="center">
											<Icon
												name={
													pendingInvite.roleName === 'Coordinator'
														? 'material-manage-accounts-filled'
														: 'material-people-filled'
												}
												htmlColor={DARK_GREY}
												size={iconSize}
											/>

											<Stack direction="column" gap={1}>
												<Typography component="p" variant="h3" fontWeight={500}>
													{pendingInvite.projectName}
												</Typography>

												<Typography sx={{ color: DARK_GREY }}>
													{t(m.projectInviteDescription, {
														role: pendingInvite.roleName?.toLowerCase(),
													})}
												</Typography>
											</Stack>
										</Stack>
									</Stack>

									<Box position="relative">
										<Box
											key={pendingInvite.inviteId}
											position="absolute"
											right={0}
											left={0}
											top={0}
											bottom={0}
											display={showRespondingToInviteLoader ? 'flex' : 'none'}
											justifyContent="center"
											alignItems="center"
										>
											<CircularProgress disableShrink size={24} />
										</Box>

										<Stack
											direction="row"
											gap={4}
											position="relative"
											visibility={
												showRespondingToInviteLoader ? 'hidden' : 'visible'
											}
										>
											<Button
												variant="outlined"
												size="medium"
												fullWidth
												aria-disabled={
													rejectInvite.status === 'pending' ||
													acceptInvite.status === 'pending'
												}
												onClick={() => {
													if (
														rejectInvite.status === 'pending' ||
														acceptInvite.status === 'pending'
													) {
														return
													}

													rejectInvite.mutate(
														{ inviteId: pendingInvite.inviteId },
														{
															onError: (err) => {
																handleInviteErrorDialogRef.current?.open({
																	from: 'reject',
																	error: err,
																})
																captureException(err)
															},
														},
													)
												}}
												sx={{ maxWidth: 200 }}
											>
												{t(m.projectInviteDecline)}
											</Button>

											<Button
												variant="contained"
												size="medium"
												fullWidth
												aria-disabled={
													rejectInvite.status === 'pending' ||
													acceptInvite.status === 'pending'
												}
												onClick={() => {
													if (
														rejectInvite.status === 'pending' ||
														acceptInvite.status === 'pending'
													) {
														return
													}

													acceptInvite.mutate(
														{
															inviteId: pendingInvite.inviteId,
														},
														{
															onError: (err) => {
																handleInviteErrorDialogRef.current?.open({
																	from: 'accept',
																	error: err,
																})
																captureException(err)
															},
															onSuccess: (projectId) => {
																projectJoinedDialogRef.current?.open({
																	projectId,
																	projectName: pendingInvite.projectName,
																})
															},
														},
													)
												}}
												sx={{ maxWidth: 200 }}
											>
												{t(m.projectInviteAccept)}
											</Button>
										</Stack>
									</Box>
								</Stack>
							</Stack>
						) : null
					}
				/>
			</Snackbar>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				dialogActionsHandle={projectJoinedDialogRef}
			>
				{(projectJoinedInfo, actions) => (
					<Stack direction="column">
						<Stack direction="column" gap={10} flex={1} padding={20}>
							<Stack direction="column" alignItems="center" gap={4}>
								<Box position="relative">
									<Icon
										name="material-people-filled"
										size={120}
										htmlColor={DARK_GREY}
									/>

									<Box
										position="absolute"
										right={-12}
										bottom={16}
										zIndex={1}
										display="flex"
										flexDirection="column"
										padding={2}
										borderRadius="50%"
										bgcolor={GREEN}
									>
										<Icon name="material-check" htmlColor={WHITE} size={24} />
									</Box>
								</Box>

								<Typography variant="h1" fontWeight={500} textAlign="center">
									{t(m.projectJoinedTitle, {
										name: projectJoinedInfo.projectName,
									})}
								</Typography>
							</Stack>
						</Stack>

						<Stack
							position="sticky"
							bottom={0}
							direction="row"
							gap={4}
							padding={6}
							justifyContent="center"
						>
							<Button
								fullWidth
								variant="outlined"
								onClick={() => {
									actions.close()
								}}
								sx={{ maxWidth: 400 }}
							>
								{t(m.projectJoinedCloseDialog)}
							</Button>

							<Button
								fullWidth
								variant="contained"
								onClick={() => {
									actions.close()

									router.navigate({
										to: '/app/projects/$projectId',
										params: { projectId: projectJoinedInfo.projectId },
									})
								}}
								sx={{ maxWidth: 400 }}
							>
								{t(m.projectJoinedViewProject)}
							</Button>
						</Stack>
					</Stack>
				)}
			</DecentDialog>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				dialogActionsHandle={handleInviteErrorDialogRef}
			>
				{({ from, error }, actions) => (
					<ErrorDialogContent
						errorMessage={error.message.toString()}
						onClose={() => {
							if (from === 'accept') {
								acceptInvite.reset()
							} else {
								rejectInvite.reset()
							}

							actions.close()
						}}
					/>
				)}
			</DecentDialog>
		</>
	)
}

const TAB_DIVIDER_COLOR = lighten(DARK_COMAPEO_BLUE, 0.1)

const BASE_INACTIVE_LINK_PROPS = {
	sx: {
		aspectRatio: 1,
		borderRadius: 0,
		color: LIGHT_GREY,
		'&:hover, &:focus-visible': {
			backgroundColor: lighten(DARK_COMAPEO_BLUE, 0.1),
		},
	},
} satisfies IconButtonLinkProps['inactiveProps']

const BASE_ACTIVE_LINK_PROPS = {
	sx: {
		aspectRatio: 1,
		borderRadius: 0,
		backgroundColor: DARK_COMAPEO_BLUE,
		color: WHITE,
		'&:hover, &:focus-visible': {
			backgroundColor: lighten(DARK_COMAPEO_BLUE, 0.1),
		},
	},
} satisfies IconButtonLinkProps['activeProps']

const m = defineMessages({
	homeTabLabel: {
		id: 'routes.app.route.homeTabTitle',
		defaultMessage: 'Home',
		description: 'Label for home tab link in navigation.',
	},
	appSettingsTabLabel: {
		id: 'routes.app.route.appSettingsTabLabel',
		defaultMessage: 'Settings',
		description: 'Label for app settings tab link in navigation.',
	},
	projectInviteTitle: {
		id: 'routes.app.route.projectInviteTitle',
		defaultMessage: "You've been invited to…",
		description: 'Title of project invite.',
	},
	projectInviteDescription: {
		id: 'routes.app.route.projectInviteDescription',
		defaultMessage:
			'Join as a <b>{role, select, coordinator {coordinator} other {participant}}</b>?',
		description: 'Description for invite containing role being invited as.',
	},
	projectInviteDecline: {
		id: 'routes.app.route.projectInviteDecline',
		defaultMessage: 'Decline',
		description: 'Button text for declining project invite.',
	},
	projectInviteAccept: {
		id: 'routes.app.route.projectInviteAccept',
		defaultMessage: 'Accept',
		description: 'Button text for accepting project invite.',
	},
	projectJoinedTitle: {
		id: 'routes.app.route.projectJoinedTitle',
		defaultMessage: 'You joined project {name}.',
		description:
			'Title of dialog displayed when joining a project successfully.',
	},
	projectJoinedCloseDialog: {
		id: 'routes.app.route.projectJoinedCloseDialog',
		defaultMessage: 'Close',
		description: 'Text for button to close project joined dialog.',
	},
	projectJoinedViewProject: {
		id: 'routes.app.route.projectJoinedViewProject',
		defaultMessage: 'View Project',
		description:
			'Text for button to navigate to joined project in project joined dialog.',
	},
})
