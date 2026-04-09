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
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DeviceIcon } from '../../../-shared/device-icon.tsx'
import { BLUE_GREY, PROJECT_ORANGE } from '../../../../../../colors.ts'
import { DecentDialog } from '../../../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../../../components/error-dialog.tsx'
import { Icon } from '../../../../../../components/icon.tsx'
import { useActiveProjectIdActions } from '../../../../../../contexts/active-project-id-store-context.ts'
import { useIconSizeBasedOnTypography } from '../../../../../../hooks/icon.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	memberIsRemoteArchive,
} from '../../../../../../lib/comapeo.ts'
import { createGlobalMutationsKey } from '../../../../../../lib/queries/global-mutations.ts'

export const Route = createFileRoute(
	'/app/projects/$projectId/_main-tabs/team/$deviceId',
)({
	loader: async ({ context, params }) => {
		const { clientApi, projectApi, queryClient } = context
		const { projectId, deviceId } = params

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
					deviceId,
				],
				queryFn: async () => {
					return projectApi.$member.getById(deviceId)
				},
			}),
		])
	},
	component: RouteComponent,
})

function RouteComponent() {
	const [showLeaveProjectDialog, setShowLeaveProjectDialog] = useState(false)

	const { formatMessage: t } = useIntl()

	const router = useRouter()

	const { projectId, deviceId } = Route.useParams()

	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { data: member } = useSingleMember({ projectId, deviceId })

	const isSelf = member.deviceId === ownDeviceInfo.deviceId

	return (
		<>
			<Stack direction="column" flex={1} overflow="auto">
				<Stack
					direction="row"
					alignItems="center"
					component="nav"
					gap={4}
					padding={4}
					borderBottom={`1px solid ${BLUE_GREY}`}
				>
					<IconButton
						aria-label={t(m.goBackAccessibleLabel)}
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

					<Typography variant="h1" fontWeight={500}>
						{t(isSelf ? m.thisDevice : m.collaboratorNavTitle)}
					</Typography>
				</Stack>

				<Suspense
					fallback={
						<Box display="grid" sx={{ placeItems: 'center' }} flex={1}>
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
			</Stack>

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
	const { formatMessage: t, formatDate } = useIntl()

	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { data: member } = useSingleMember({ projectId, deviceId })

	const isSelf = member.deviceId === ownDeviceInfo.deviceId

	const truncatedDeviceId = member.deviceId.slice(0, 12)

	const roleIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h3',
		multiplier: 1.5,
	})

	let title: string
	let description: JSX.Element

	const isRemoteArchive = memberIsRemoteArchive(member)

	if (isRemoteArchive) {
		title = member.name || t(m.remoteArchive)
		description = (
			<Typography
				component="p"
				variant="h3"
				fontWeight={500}
				textAlign="center"
				sx={{ overflowWrap: 'anywhere' }}
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
					fontWeight={500}
					textAlign="center"
				>
					{t(isAtLeastCoordinator ? m.coordinator : m.participant)}
				</Typography>
			</>
		)
	}

	return (
		<Stack
			direction="column"
			flex={1}
			justifyContent="space-between"
			overflow="auto"
			padding={6}
			gap={6}
		>
			<Stack
				flex={1}
				direction="column"
				border={`1px solid ${BLUE_GREY}`}
				borderRadius={2}
				padding={10}
				justifyContent="center"
				gap={20}
				sx={{ overflowWrap: 'break-word' }}
			>
				<Stack direction="column" gap={4} alignItems="center">
					<DeviceIcon deviceType={member.deviceType} size="60px" />

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{title}
					</Typography>

					<Stack direction="row" gap={2} alignItems="center">
						{description}
					</Stack>
				</Stack>

				<Stack direction="column" gap={4} alignItems="center">
					<Typography
						color="textSecondary"
						textAlign="center"
						sx={{ overflowWrap: 'anywhere' }}
					>
						{truncatedDeviceId}
					</Typography>

					{member.joinedAt ? (
						<Typography color="textSecondary" textAlign="center">
							{t(m.addedOn, {
								value: (
									<time key={member.deviceId} dateTime={member.joinedAt}>
										{formatDate(member.joinedAt, {
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
				<Box display="flex" flexDirection="row" justifyContent="center">
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
						{t(m.leaveProjectButton)}
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
	const { formatMessage: t } = useIntl()
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

	if (warningToShow) {
		return (
			<Stack direction="column">
				<Stack direction="column" gap={10} flex={1} padding={20}>
					<Stack direction="column" alignItems="center" gap={4}>
						<Box position="relative">
							<DeviceIcon deviceType={member.deviceType} size="60px" />

							<Box position="absolute" right={-8} bottom={-16}>
								<Icon name="material-error" color="error" size={36} />
							</Box>
						</Box>

						<Typography variant="h1" fontWeight={500} textAlign="center">
							{t(
								warningToShow === 'last_device'
									? m.lastDeviceWarningTitle
									: m.lastCoordinatorWarningTitle,
							)}
						</Typography>

						<Typography textAlign="center">
							{t(
								warningToShow === 'last_device'
									? m.lastDeviceWarningDescription
									: m.lastCoordinatorWarningDescription,
							)}
						</Typography>

						<Box
							alignSelf="stretch"
							padding={6}
							borderRadius={2}
							border={`1px solid ${BLUE_GREY}`}
							sx={{ backgroundColor: PROJECT_ORANGE }}
						>
							<List disablePadding>
								<Stack direction="column" gap={2}>
									{warningToShow === 'last_coordinator' ? (
										<ListItem disableGutters disablePadding>
											<Stack direction="row" gap={2}>
												<Icon
													name="openmoji-mobile-phone-with-arrow"
													size={suggestionIconSize}
													sx={{ alignSelf: 'flex-start' }}
												/>

												<Typography variant="body2" color="textSecondary">
													{t(m.suggestionInviteCoordinator)}
												</Typography>
											</Stack>
										</ListItem>
									) : null}

									<ListItem disableGutters disablePadding>
										<Stack direction="row" gap={2}>
											<Icon
												name="openmoji-download"
												size={suggestionIconSize}
												sx={{ alignSelf: 'flex-start' }}
											/>

											<Typography variant="body2" color="textSecondary">
												{t(m.suggestionExportData)}
											</Typography>
										</Stack>
									</ListItem>
								</Stack>
							</List>
						</Box>
					</Stack>
				</Stack>

				<Stack
					direction="row"
					alignItems="center"
					position="sticky"
					bottom={0}
					gap={4}
					padding={6}
				>
					<Button
						fullWidth
						variant="outlined"
						onClick={() => {
							onClose()
						}}
						sx={{ maxWidth: 400, alignSelf: 'center' }}
					>
						{t(m.cancelButton)}
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
						{t(m.continueButton)}
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
	const { formatMessage: t } = useIntl()

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
			<Stack direction="column">
				<Stack direction="column" gap={10} flex={1} padding={20}>
					<Stack direction="column" alignItems="center" gap={4}>
						<Icon name="material-logout" htmlColor={BLUE_GREY} size={72} />

						<Typography variant="h1" fontWeight={500} textAlign="center">
							{t(m.leaveProjectConfirmationTitle)}
						</Typography>

						<Typography textAlign="center">
							{t(m.leaveProjectConfirmationDescription, {
								name: projectName || '',
							})}
						</Typography>
					</Stack>
				</Stack>

				<Stack
					direction="row"
					alignItems="center"
					position="sticky"
					bottom={0}
					gap={4}
					padding={6}
				>
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
						{t(m.cancelButton)}
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
						{t(m.confirmButton)}
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
		id: 'routes.app.projects.$projectId.team.$deviceId.collaboratorNavTitle',
		defaultMessage: 'Collaborator Info',
		description: 'Title of the team collaborator info page.',
	},
	leaveProjectNavTitle: {
		id: 'routes.app.projects.$projectId.team.$deviceId.leaveProjectNavTitle',
		defaultMessage: 'Leave Project',
		description:
			'Title of the team collaborator info page when the leave project flow is initiated.',
	},
	thisDevice: {
		id: 'routes.app.projects.$projectId.team.$deviceId.thisDevice',
		defaultMessage: 'This Device',
		description: 'Text indicating that user is viewing itself.',
	},
	coordinator: {
		id: 'routes.app.projects.$projectId.team.$deviceId.coordinator',
		defaultMessage: 'Coordinator',
		description: 'Text indicating collaborator is a coordinator.',
	},
	participant: {
		id: 'routes.app.projects.$projectId.team.$deviceId.participant',
		defaultMessage: 'Participant',
		description: 'Text indicating collaborator is a participant.',
	},
	remoteArchive: {
		id: 'routes.app.projects.$projectId.team.$deviceId.remoteArchive',
		defaultMessage: 'Remote Archive',
		description: 'Fallback name used if remote archive does not have name.',
	},
	addedOn: {
		id: 'routes.app.projects.$projectId.team.$deviceId.addedOn',
		defaultMessage: 'Added on {value}',
		description: 'Text indicating date collaborator was added to the project.',
	},
	leaveProjectButton: {
		id: 'routes.app.projects.$projectId.team.$deviceId.leaveProjectButton',
		defaultMessage: 'Leave Project',
		description: 'Button text to initiate leave project flow.',
	},
	lastCoordinatorWarningTitle: {
		id: 'routes.app.projects.$projectId.team.$deviceId.lastCoordinatorWarningTitle',
		defaultMessage: 'Device is last coordinator.',
		description:
			'Title text for last coordinator warning when leaving a project.',
	},
	lastCoordinatorWarningDescription: {
		id: 'routes.app.projects.$projectId.team.$deviceId.lastCoordinatorWarningDescription',
		defaultMessage:
			'If this device leaves, then no other device can add or remove devices, adjust project info, or update the categories set.',
		description:
			'Description text for last coordinator warning when leaving a project.',
	},
	lastDeviceWarningTitle: {
		id: 'routes.app.projects.$projectId.team.$deviceId.lastDeviceWarningTitle',
		defaultMessage: 'Device is last device.',
		description: 'Title text for last device warning when leaving a project.',
	},
	lastDeviceWarningDescription: {
		id: 'routes.app.projects.$projectId.team.$deviceId.lastDeviceWarningDescription',
		defaultMessage:
			'If this device leaves, then all data on this project will be lost.',
		description:
			'Description text for last device warning when leaving a project.',
	},
	suggestionExportData: {
		id: 'routes.app.projects.$projectId.team.$deviceId.suggestionExportData',
		defaultMessage: 'Before leaving, export any important data.',
		description:
			'Text for export data suggestion in warning when leaving a project.',
	},
	suggestionInviteCoordinator: {
		id: 'routes.app.projects.$projectId.team.$deviceId.suggestionInviteCoordinator',
		defaultMessage: 'To avoid this, invite a new device as a coordinator.',
		description:
			'Text for invite coordinator suggestion in warning when leaving a project.',
	},
	leaveProjectConfirmationTitle: {
		id: 'routes.app.projects.$projectId.team.$deviceId.leaveProjectConfirmationTitle',
		defaultMessage: 'Leave this project?',
		description:
			'Title text for leave project confirmation when leaving a project.',
	},
	leaveProjectConfirmationDescription: {
		id: 'routes.app.projects.$projectId.team.$deviceId.leaveProjectConfirmationDescription',
		defaultMessage:
			'Device will no longer be able to view, contribute to, or adjust the project <b>{name}</b>.',
		description:
			'Description for leave project confirmation when leaving a project.',
	},
	cancelButton: {
		id: 'routes.app.projects.$projectId.team.$deviceId.cancelButton',
		defaultMessage: 'Cancel',
		description: 'Button text to cancel leaving project.',
	},
	continueButton: {
		id: 'routes.app.projects.$projectId.team.$deviceId.continueButton',
		defaultMessage: 'Continue',
		description: 'Button text to continue to next step in leave project flow.',
	},
	confirmButton: {
		id: 'routes.app.projects.$projectId.team.$deviceId.confirmButton',
		defaultMessage: 'Yes, Leave',
		description: 'Button text to confirm leaving project.',
	},
	goBackAccessibleLabel: {
		id: 'routes.app.projects.$projectId.team.$deviceId.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button.',
	},
})
