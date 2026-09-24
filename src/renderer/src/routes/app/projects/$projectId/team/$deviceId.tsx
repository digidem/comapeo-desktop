import { Suspense, useState, type JSX } from 'react'
import {
	useLeaveProject,
	useManyMembers,
	useOwnDeviceInfo,
	useProjectSettings,
	useSingleMember,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DeviceIcon } from '../../-shared/device-icon.tsx'
import {
	BLUE_GREY,
	DARK_GREY,
	PROJECT_ORANGE,
	WHITE,
} from '../../../../../colors.ts'
import { DecentDialog } from '../../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../../components/error-dialog.tsx'
import { Icon } from '../../../../../components/icon.tsx'
import { useActiveProjectIdActions } from '../../../../../contexts/active-project-id-store-context.ts'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	memberIsRemoteArchive,
} from '../../../../../lib/comapeo.ts'
import { createGlobalMutationsKey } from '../../../../../lib/queries/global-mutations.ts'

export const Route = createFileRoute('/app/projects/$projectId/team/$deviceId')(
	{
		loader: async ({ context, params }) => {
			const { clientApi, projectApi, queryClient } = context
			const { projectId, deviceId } = params

			await Promise.all([
				queryClient.query({
					staleTime: 'static',
					queryKey: [
						COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
						'client',
						'device_info',
					],
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
						deviceId,
					],
					queryFn: async () => {
						return projectApi.$member.getById(deviceId)
					},
				}),
			])
		},
		component: RouteComponent,
	},
)

function RouteComponent() {
	const [showLeaveProjectDialog, setShowLeaveProjectDialog] = useState(false)

	const intl = useIntl()

	const router = useRouter()

	const { projectId, deviceId } = Route.useParams()

	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { data: member } = useSingleMember({ projectId, deviceId })

	const isSelf = member.deviceId === ownDeviceInfo.deviceId

	return (
		<>
			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Stack
					component="header"
					direction="row"
					sx={{
						alignItems: 'center',
						borderBottom: `1px solid ${BLUE_GREY}`,
						gap: 4,
						padding: 4,
					}}
				>
					<IconButton
						aria-label={intl.formatMessage(m.goBackAccessibleLabel)}
						onClick={() => {
							if (router.history.canGoBack()) {
								router.history.back()
								return
							}

							router.navigate({
								to: '/app/projects/$projectId/team',
								params: { projectId },
								replace: true,
							})
						}}
					>
						<Icon name="material-arrow-back" size={30} />
					</IconButton>

					<Typography variant="h1" sx={{ fontWeight: 500 }}>
						{intl.formatMessage(isSelf ? m.thisDevice : m.collaboratorNavTitle)}
					</Typography>
				</Stack>

				<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
					<Container
						disableGutters
						maxWidth="sm"
						sx={{
							display: 'flex',
							flex: 1,
							flexDirection: 'column',
							paddingBlock: 6,
							paddingInline: 4,
						}}
					>
						<Suspense
							fallback={
								<Box sx={{ display: 'grid', flex: 1, placeItems: 'center' }}>
									<CircularProgress disableShrink size={30} />
								</Box>
							}
						>
							<CollaboratorInfoContent
								projectId={projectId}
								deviceId={deviceId}
								onLeaveProject={() => {
									setShowLeaveProjectDialog(true)
								}}
							/>
						</Suspense>
					</Container>
				</Stack>
			</Stack>

			<Suspense>
				<DecentDialog
					fullWidth
					maxWidth="sm"
					value={showLeaveProjectDialog || null}
				>
					{() => (
						<LeaveProjectDialogContent
							deviceId={deviceId}
							projectId={projectId}
							onClose={() => {
								setShowLeaveProjectDialog(false)
							}}
						/>
					)}
				</DecentDialog>
			</Suspense>
		</>
	)
}

function CollaboratorInfoContent({
	projectId,
	deviceId,
	onLeaveProject,
}: {
	projectId: string
	deviceId: string
	onLeaveProject: () => void
}) {
	const intl = useIntl()

	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { data: member } = useSingleMember({ projectId, deviceId })

	const isSelf = member.deviceId === ownDeviceInfo.deviceId

	const truncatedDeviceId = member.deviceId.slice(0, 12)

	const deviceIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 5,
	})

	const roleIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h3',
		multiplier: 1.5,
	})

	let title: string
	let description: JSX.Element

	const isRemoteArchive = memberIsRemoteArchive(member)

	if (isRemoteArchive) {
		title = member.name || intl.formatMessage(m.remoteArchive)
		description = (
			<Typography
				component="p"
				variant="h3"
				sx={{ fontWeight: 500, textAlign: 'center', overflowWrap: 'anywhere' }}
			>
				{member.selfHostedServerDetails.baseUrl}
			</Typography>
		)
	} else {
		const isAtLeastCoordinator =
			member.role.roleId === CREATOR_ROLE_ID ||
			member.role.roleId === COORDINATOR_ROLE_ID

		title = member.name || truncatedDeviceId
		description = (
			<>
				<Icon
					name={
						isAtLeastCoordinator
							? 'material-manage-accounts-filled'
							: 'material-people-filled'
					}
					size={roleIconSize}
				/>

				<Typography
					component="p"
					variant="h3"
					sx={{ fontWeight: 500, textAlign: 'center' }}
				>
					{intl.formatMessage(
						isAtLeastCoordinator ? m.coordinator : m.participant,
					)}
				</Typography>
			</>
		)
	}

	return (
		<Stack
			direction="column"
			sx={{ flex: 1, gap: 10, justifyContent: 'space-between' }}
		>
			<Stack
				direction="column"
				sx={{
					border: `1px solid ${BLUE_GREY}`,
					borderRadius: 2,
					flex: 1,
					gap: 20,
					justifyContent: 'center',
					overflowWrap: 'break-word',
					paddingBlock: 20,
					paddingInline: 6,
				}}
			>
				<Stack direction="column" sx={{ gap: 4, alignItems: 'center' }}>
					<DeviceIcon
						deviceType={member.deviceType}
						htmlColor={DARK_GREY}
						size={deviceIconSize}
					/>

					<Typography
						variant="h1"
						sx={{ fontWeight: 500, textAlign: 'center' }}
					>
						{title}
					</Typography>

					<Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
						{description}
					</Stack>
				</Stack>

				<Stack direction="column" sx={{ gap: 4, alignItems: 'center' }}>
					<Typography
						color="textSecondary"
						sx={{ textAlign: 'center', overflowWrap: 'anywhere' }}
					>
						{truncatedDeviceId}
					</Typography>

					{member.joinedAt ? (
						<Typography color="textSecondary" sx={{ textAlign: 'center' }}>
							{intl.formatMessage(m.addedOn, {
								value: (
									<time key={member.deviceId} dateTime={member.joinedAt}>
										{intl.formatDate(member.joinedAt, {
											year: 'numeric',
											month: 'long',
											day: '2-digit',
										})}
									</time>
								),
							})}
						</Typography>
					) : null}
				</Stack>
			</Stack>

			{isSelf &&
			// NOTE: Remote archives go through different flow
			!isRemoteArchive ? (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'center',
					}}
				>
					<Button
						variant="outlined"
						fullWidth
						color="error"
						startIcon={<Icon name="material-logout" />}
						sx={{ maxWidth: 400 }}
						onClick={() => {
							onLeaveProject()
						}}
					>
						{intl.formatMessage(m.leaveProjectButton)}
					</Button>
				</Box>
			) : null}
		</Stack>
	)
}

function LeaveProjectDialogContent({
	deviceId,
	onClose,
	projectId,
}: {
	deviceId: string
	onClose: () => void
	projectId: string
}) {
	const intl = useIntl()

	const { data: projectSettings } = useProjectSettings({ projectId })

	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { data: activeMembers } = useManyMembers({
		projectId,
		includeLeft: false,
	})

	const member = activeMembers.find((m) => m.deviceId === deviceId)!

	const isAtLeastCoordinator =
		member.role.roleId === CREATOR_ROLE_ID ||
		member.role.roleId === COORDINATOR_ROLE_ID

	const isLastActiveDevice =
		activeMembers.length === 1 && activeMembers[0]!.deviceId === deviceId

	const isLastCoordinator =
		isAtLeastCoordinator &&
		!activeMembers.some(
			(m) =>
				m.deviceId !== ownDeviceInfo.deviceId &&
				(m.role.roleId === CREATOR_ROLE_ID ||
					m.role.roleId === COORDINATOR_ROLE_ID),
		)

	const [warningToShow, setWarningToShow] = useState(() => {
		return isLastActiveDevice
			? 'last_device'
			: isLastCoordinator
				? 'last_coordinator'
				: undefined
	})

	const suggestionIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body2',
	})

	const deviceIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 3,
	})

	const errorIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 1,
	})

	if (warningToShow) {
		return (
			<Stack direction="column" sx={{ gap: 10, padding: 6 }}>
				<Stack direction="column" sx={{ gap: 10, flex: 1 }}>
					<Stack direction="column" sx={{ alignItems: 'center', gap: 4 }}>
						<Box sx={{ position: 'relative' }}>
							<DeviceIcon
								deviceType={member.deviceType}
								size={deviceIconSize}
								htmlColor={DARK_GREY}
							/>

							<Box
								sx={{
									position: 'absolute',
									right: -12,
									bottom: 0,
									display: 'grid',
									placeItems: 'center',
									borderRadius: '50%',
									padding: 1,
									backgroundColor: (theme) => theme.palette.error.main,
								}}
							>
								<Icon
									name="material-symbols-exclamation"
									htmlColor={WHITE}
									size={errorIconSize}
								/>
							</Box>
						</Box>

						<Typography
							variant="h1"
							sx={{ fontWeight: 500, textAlign: 'center' }}
						>
							{intl.formatMessage(
								warningToShow === 'last_device'
									? m.lastDeviceWarningTitle
									: m.lastCoordinatorWarningTitle,
							)}
						</Typography>

						<Typography sx={{ textAlign: 'center' }}>
							{intl.formatMessage(
								warningToShow === 'last_device'
									? m.lastDeviceWarningDescription
									: m.lastCoordinatorWarningDescription,
							)}
						</Typography>

						<Box
							sx={{
								alignSelf: 'stretch',
								padding: 6,
								borderRadius: 2,
								border: `1px solid ${BLUE_GREY}`,
								backgroundColor: PROJECT_ORANGE,
							}}
						>
							<List disablePadding>
								<Stack direction="column" sx={{ gap: 2 }}>
									{warningToShow === 'last_coordinator' ? (
										<ListItem disableGutters disablePadding>
											<Stack direction="row" sx={{ gap: 2 }}>
												<Icon
													name="openmoji-mobile-phone-with-arrow"
													size={suggestionIconSize}
													sx={{ alignSelf: 'flex-start' }}
												/>

												<Typography variant="body2" color="textSecondary">
													{intl.formatMessage(m.suggestionInviteCoordinator)}
												</Typography>
											</Stack>
										</ListItem>
									) : null}

									<ListItem disableGutters disablePadding>
										<Stack direction="row" sx={{ gap: 2 }}>
											<Icon
												name="openmoji-download"
												size={suggestionIconSize}
												sx={{ alignSelf: 'flex-start' }}
											/>

											<Typography variant="body2" color="textSecondary">
												{intl.formatMessage(m.suggestionExportData)}
											</Typography>
										</Stack>
									</ListItem>
								</Stack>
							</List>
						</Box>
					</Stack>
				</Stack>

				<Stack direction="row" sx={{ alignItems: 'center', gap: 4 }}>
					<Button
						fullWidth
						variant="outlined"
						onClick={() => {
							onClose()
						}}
						sx={{ maxWidth: 400, alignSelf: 'center' }}
					>
						{intl.formatMessage(m.cancelButton)}
					</Button>

					<Button
						fullWidth
						variant="contained"
						color="error"
						endIcon={<Icon name="material-symbols-arrow-circle-right" />}
						onClick={() => {
							setWarningToShow(undefined)
						}}
						sx={{ maxWidth: 400, alignSelf: 'center' }}
					>
						{intl.formatMessage(m.continueButton)}
					</Button>
				</Stack>
			</Stack>
		)
	}

	return (
		<LeaveProjectConfirmation
			projectId={projectId}
			projectName={projectSettings.name}
			onClose={onClose}
		/>
	)
}

const LEAVE_PROJECT_AND_NAVIGATE_MUTATION_KEY = createGlobalMutationsKey([
	'leave_project_and_navigate',
])

function LeaveProjectConfirmation({
	onClose,
	projectId,
	projectName,
}: {
	onClose: () => void
	projectId: string
	projectName?: string
}) {
	const intl = useIntl()

	const router = useRouter()

	const activeProjectIdActions = useActiveProjectIdActions()

	const _leaveProject = useLeaveProject()
	const leaveProject = useMutation({
		mutationKey: LEAVE_PROJECT_AND_NAVIGATE_MUTATION_KEY,
		mutationFn: async ({ projectId }: { projectId: string }) => {
			return _leaveProject.mutateAsync({ projectId })
		},
	})

	return (
		<>
			<Stack direction="column" sx={{ gap: 10, padding: 6 }}>
				<Stack direction="column" sx={{ gap: 10, flex: 1, padding: 10 }}>
					<Stack direction="column" sx={{ alignItems: 'center', gap: 4 }}>
						<Icon name="material-logout" htmlColor={BLUE_GREY} size={72} />

						<Typography
							variant="h1"
							sx={{ fontWeight: 500, textAlign: 'center' }}
						>
							{intl.formatMessage(m.leaveProjectConfirmationTitle)}
						</Typography>

						<Typography sx={{ textAlign: 'center' }}>
							{intl.formatMessage(m.leaveProjectConfirmationDescription, {
								name: projectName || '',
							})}
						</Typography>
					</Stack>
				</Stack>

				<Stack direction="row" sx={{ alignItems: 'center', gap: 4 }}>
					<Button
						fullWidth
						variant="outlined"
						aria-disabled={leaveProject.status === 'pending'}
						onClick={() => {
							if (leaveProject.status === 'pending') {
								return
							}

							onClose()
						}}
						sx={{ maxWidth: 400, alignSelf: 'center' }}
					>
						{intl.formatMessage(m.cancelButton)}
					</Button>

					<Button
						fullWidth
						variant="contained"
						color="error"
						startIcon={<Icon name="material-logout" />}
						loading={leaveProject.status === 'pending'}
						loadingPosition="start"
						onClick={() => {
							if (leaveProject.status === 'pending') {
								return
							}

							leaveProject.mutate(
								{ projectId },
								{
									onSuccess: async () => {
										onClose()

										activeProjectIdActions.update(undefined)

										return router.navigate({
											to: '/app',
											search: {
												fromFlow: { name: 'project_leave', projectName },
											},
											mask: { to: '/app', unmaskOnReload: true },
										})
									},
								},
							)
						}}
						sx={{ maxWidth: 400, alignSelf: 'center' }}
					>
						{intl.formatMessage(m.confirmButton)}
					</Button>
				</Stack>
			</Stack>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={leaveProject.status === 'error' ? leaveProject.error : null}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							leaveProject.reset()
						}}
					/>
				)}
			</DecentDialog>
		</>
	)
}

const m = defineMessages({
	collaboratorNavTitle: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.collaboratorNavTitle',
		defaultMessage: 'Collaborator Info',
		description: 'Title of the team collaborator info page.',
	},
	leaveProjectNavTitle: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.leaveProjectNavTitle',
		defaultMessage: 'Leave Project',
		description:
			'Title of the team collaborator info page when the leave project flow is initiated.',
	},
	thisDevice: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.thisDevice',
		defaultMessage: 'This Device',
		description: 'Text indicating that user is viewing itself.',
	},
	coordinator: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.coordinator',
		defaultMessage: 'Coordinator',
		description: 'Text indicating collaborator is a coordinator.',
	},
	participant: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.participant',
		defaultMessage: 'Participant',
		description: 'Text indicating collaborator is a participant.',
	},
	remoteArchive: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.remoteArchive',
		defaultMessage: 'Remote Archive',
		description: 'Fallback name used if remote archive does not have name.',
	},
	addedOn: {
		id: 'routes.app.projects.$projectId.team.$deviceId.addedOn',
		defaultMessage: 'Added on {value}',
		description: 'Text indicating date collaborator was added to the project.',
	},
	leaveProjectButton: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.leaveProjectButton',
		defaultMessage: 'Leave Project',
		description: 'Button text to initiate leave project flow.',
	},
	lastCoordinatorWarningTitle: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.lastCoordinatorWarningTitle',
		defaultMessage: 'Device is last coordinator.',
		description:
			'Title text for last coordinator warning when leaving a project.',
	},
	lastCoordinatorWarningDescription: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.lastCoordinatorWarningDescription',
		defaultMessage:
			'If this device leaves, then no other device can add or remove devices, adjust project info, or update the categories set.',
		description:
			'Description text for last coordinator warning when leaving a project.',
	},
	lastDeviceWarningTitle: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.lastDeviceWarningTitle',
		defaultMessage: 'Device is last device.',
		description: 'Title text for last device warning when leaving a project.',
	},
	lastDeviceWarningDescription: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.lastDeviceWarningDescription',
		defaultMessage:
			'If this device leaves, then all data on this project will be lost.',
		description:
			'Description text for last device warning when leaving a project.',
	},
	suggestionExportData: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.suggestionExportData',
		defaultMessage: 'Before leaving, export any important data.',
		description:
			'Text for export data suggestion in warning when leaving a project.',
	},
	suggestionInviteCoordinator: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.suggestionInviteCoordinator',
		defaultMessage: 'To avoid this, invite a new device as a coordinator.',
		description:
			'Text for invite coordinator suggestion in warning when leaving a project.',
	},
	leaveProjectConfirmationTitle: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.leaveProjectConfirmationTitle',
		defaultMessage: 'Leave this project?',
		description:
			'Title text for leave project confirmation when leaving a project.',
	},
	leaveProjectConfirmationDescription: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.leaveProjectConfirmationDescription',
		defaultMessage:
			'Device will no longer be able to view, contribute to, or adjust the project <b>{name}</b>.',
		description:
			'Description for leave project confirmation when leaving a project.',
	},
	cancelButton: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.cancelButton',
		defaultMessage: 'Cancel',
		description: 'Button text to cancel leaving project.',
	},
	continueButton: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.continueButton',
		defaultMessage: 'Continue',
		description: 'Button text to continue to next step in leave project flow.',
	},
	confirmButton: {
		id: '$1.routes.app.projects.$projectId.team.$deviceId.confirmButton',
		defaultMessage: 'Yes, Leave',
		description: 'Button text to confirm leaving project.',
	},
	goBackAccessibleLabel: {
		id: 'routes.app.projects.$projectId.team.$deviceId.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button.',
	},
})
