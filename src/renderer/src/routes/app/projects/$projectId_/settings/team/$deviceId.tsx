import { Suspense, useState } from 'react'
import {
	useClientApi,
	useLeaveProject,
	useManyMembers,
	useOwnDeviceInfo,
	useSingleMember,
} from '@comapeo/core-react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DeviceIcon } from '../../../-shared/device-icon'
import { BLUE_GREY } from '../../../../../../colors'
import { ErrorDialog } from '../../../../../../components/error-dialog'
import { Icon } from '../../../../../../components/icon'
import { useIconSizeBasedOnTypography } from '../../../../../../hooks/icon'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../../../lib/comapeo'
import { setActiveProjectIdMutationOptions } from '../../../../../../lib/queries/app-settings'
import { createGlobalMutationsKey } from '../../../../../../lib/queries/global-mutations'

export const Route = createFileRoute(
	'/app/projects/$projectId_/settings/team/$deviceId',
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

const LEAVE_PROJECT_AND_NAVIGATE_MUTATION_KEY = createGlobalMutationsKey([
	'leave_project_and_navigate',
])

function RouteComponent() {
	const [showLeaveProject, setShowLeaveProject] = useState(false)

	const { formatMessage: t } = useIntl()

	const router = useRouter()

	const { projectId, deviceId } = Route.useParams()

	const clientApi = useClientApi()

	const leaveProject = useLeaveProject()

	const setActiveProjectId = useMutation(setActiveProjectIdMutationOptions())

	const leaveProjectAndNavigate = useMutation({
		mutationKey: LEAVE_PROJECT_AND_NAVIGATE_MUTATION_KEY,
		mutationFn: async ({ projectId }: { projectId: string }) => {
			return leaveProject.mutateAsync({ projectId })
		},
		onSuccess: async () => {
			// TODO: Ideally we don't autonavigate to some arbitrary project.
			// Instead we should allow the user to choose which project to enter.
			// Okay to do for now because we don't allow joining another project after the onboarding right now.
			const projects = await clientApi.listProjects()

			const projectToNavigateTo = projects.find(
				(p) => p.projectId !== projectId,
			)

			if (projectToNavigateTo) {
				router.navigate({
					to: '/app/projects/$projectId',
					params: { projectId: projectToNavigateTo.projectId },
				})
			} else {
				await setActiveProjectId.mutateAsync(null)
				router.navigate({ to: '/onboarding/project', reloadDocument: true })
			}
		},
	})

	return (
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
					onClick={
						showLeaveProject
							? () => {
									if (leaveProjectAndNavigate.status === 'pending') {
										return
									}

									setShowLeaveProject(false)
								}
							: () => {
									if (router.history.canGoBack()) {
										router.history.back()
										return
									}

									router.navigate({
										to: '/app/projects/$projectId/settings/team',
										params: { projectId },
										replace: true,
									})
								}
					}
				>
					<Icon name="material-arrow-back" size={30} />
				</IconButton>

				<Typography variant="h1" fontWeight={500}>
					{t(
						showLeaveProject ? m.leaveProjectNavTitle : m.collaboratorNavTitle,
					)}
				</Typography>
			</Stack>

			<Suspense
				fallback={
					<Box display="grid" sx={{ placeItems: 'center' }} flex={1}>
						<CircularProgress disableShrink size={30} />
					</Box>
				}
			>
				{showLeaveProject ? (
					<>
						<LeaveProjectContent
							projectId={projectId}
							deviceId={deviceId}
							isLeaving={leaveProjectAndNavigate.status === 'pending'}
							onConfirm={() => {
								leaveProjectAndNavigate.mutate({ projectId })
							}}
						/>

						<ErrorDialog
							open={leaveProjectAndNavigate.status === 'error'}
							errorMessage={leaveProjectAndNavigate.error?.toString()}
							onClose={() => {
								leaveProjectAndNavigate.reset()
							}}
						/>
					</>
				) : (
					<CollaboratorInfoContent
						projectId={projectId}
						deviceId={deviceId}
						onLeaveProject={() => {
							setShowLeaveProject(true)
						}}
					/>
				)}
			</Suspense>
		</Stack>
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

	const isAtLeastCoordinator =
		member.role.roleId === COORDINATOR_ROLE_ID ||
		member.role.roleId === CREATOR_ROLE_ID

	const truncatedDeviceId = member.deviceId.slice(0, 12)
	const displayedName = member.name || truncatedDeviceId

	const roleIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h3',
		multiplier: 1.5,
	})

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
			>
				<Stack direction="column" gap={4} alignItems="center">
					<DeviceIcon deviceType={member.deviceType} size="60px" />

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{displayedName}
					</Typography>

					{isSelf ? (
						<Typography variant="h3" fontWeight={500} textAlign="center">
							{t(m.thisDevice)}
						</Typography>
					) : null}

					<Stack direction="row" gap={2} alignItems="center">
						<Icon
							name={
								isAtLeastCoordinator
									? 'material-person-add'
									: 'material-manage-accounts-filled'
							}
							size={roleIconSize}
						/>

						<Typography variant="h3" fontWeight={500} textAlign="center">
							{t(isAtLeastCoordinator ? m.coordinator : m.participant)}
						</Typography>
					</Stack>
				</Stack>

				<Stack direction="column" gap={4} alignItems="center">
					<Typography color="textSecondary" textAlign="center">
						{truncatedDeviceId}
					</Typography>

					{member.joinedAt ? (
						<Typography color="textSecondary" textAlign="center">
							{t(m.addedOn, {
								value: formatDate(member.joinedAt, {
									year: 'numeric',
									month: 'long',
									day: '2-digit',
								}),
							})}
						</Typography>
					) : null}
				</Stack>
			</Stack>

			{isSelf ? (
				<Box display="flex" flexDirection="row" justifyContent="center">
					<Button
						variant="outlined"
						fullWidth
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

function LeaveProjectContent({
	projectId,
	deviceId,
	onConfirm,
	isLeaving,
}: {
	deviceId: string
	projectId: string
	onConfirm: () => void
	isLeaving: boolean
}) {
	const { formatMessage: t } = useIntl()

	const iconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 4,
	})

	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { data: member } = useSingleMember({ projectId, deviceId })

	const { data: members } = useManyMembers({ projectId })

	const selfIsLastCoordinator = !members
		.filter(
			(m) =>
				m.role.roleId === CREATOR_ROLE_ID ||
				m.role.roleId === COORDINATOR_ROLE_ID,
		)
		.some((m) => m.deviceId !== ownDeviceInfo.deviceId)

	const displayedName = member.name || member.deviceId.slice(0, 12)

	return (
		<Stack
			direction="column"
			flex={1}
			justifyContent="space-between"
			overflow="auto"
			padding={6}
			gap={6}
		>
			{selfIsLastCoordinator ? (
				<Alert
					severity="warning"
					icon={<Icon name="material-warning-rounded" />}
					sx={{
						border: `1px solid ${BLUE_GREY}`,
						borderRadius: 2,
					}}
				>
					<Typography>{t(m.lastCoordinatorWarning)}</Typography>
				</Alert>
			) : null}

			<Stack
				direction="column"
				border={`1px solid ${BLUE_GREY}`}
				borderRadius={2}
				justifyContent="center"
				alignItems="center"
				padding={6}
				gap={10}
				flex={1}
			>
				<Stack direction="column" gap={6} alignItems="center">
					<Icon name="material-logout" htmlColor={BLUE_GREY} size={iconSize} />

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.leaveProjectExplainerTitle)}
					</Typography>
				</Stack>

				<Typography textAlign="center">
					{t(m.leaveProjectExplainerDescription, { name: displayedName })}
				</Typography>
			</Stack>

			<Box display="flex" flexDirection="row" justifyContent="center">
				<Button
					variant="contained"
					color="error"
					fullWidth
					sx={{ maxWidth: 400 }}
					loadingPosition="start"
					loading={isLeaving}
					onClick={() => {
						onConfirm()
					}}
				>
					{t(m.confirmButton)}
				</Button>
			</Box>
		</Stack>
	)
}

const m = defineMessages({
	collaboratorNavTitle: {
		id: 'routes.app.projects.$projectId_.settings.team.$deviceId.collaboratorNavTitle',
		defaultMessage: 'Collaborator Info',
		description: 'Title of the team collaborator info page.',
	},
	leaveProjectNavTitle: {
		id: 'routes.app.projects.$projectId_.settings.team.$deviceId.leaveProjectNavTitle',
		defaultMessage: 'Leave Project',
		description:
			'Title of the team collaborator info page when the leave project flow is initiated.',
	},
	thisDevice: {
		id: 'routes.app.projects.$projectId_.settings.team.$deviceId.thisDevice',
		defaultMessage: 'This Device!',
		description: 'Text indicating that user is viewing itslef.',
	},
	coordinator: {
		id: 'routes.app.projects.$projectId_.settings.team.$deviceId.coordinator',
		defaultMessage: 'Coordinator',
		description: 'Text indicating collaborator is a coordinator.',
	},
	participant: {
		id: 'routes.app.projects.$projectId_.settings.team.$deviceId.participant',
		defaultMessage: 'Participant',
		description: 'Text indicating collaborator is a participant.',
	},
	addedOn: {
		id: 'routes.app.projects.$projectId_.settings.team.$deviceId.addedOn',
		defaultMessage: 'Added on {value}',
		description: 'Text indicating date collaborator was added to the project.',
	},
	leaveProjectButton: {
		id: 'routes.app.projects.$projectId_.settings.team.$deviceId.leaveProjectButton',
		defaultMessage: 'Leave Project',
		description: 'Button text to initiate leave project flow.',
	},
	lastCoordinatorWarning: {
		id: 'routes.app.projects.$projectId_.settings.team.$deviceId.lastCoordinatorWarning',
		defaultMessage:
			"You're the last coordinator. Consider making another device a coordinator before leaving the project.",
		description:
			'Warning text about leaving the project as the last coordinator.',
	},
	leaveProjectExplainerTitle: {
		id: 'routes.app.projects.$projectId_.settings.team.$deviceId.leaveProjectExplainerTitle',
		defaultMessage: 'Leave Project?',
		description: 'Title text for leave project explanation.',
	},
	leaveProjectExplainerDescription: {
		id: 'routes.app.projects.$projectId_.settings.team.$deviceId.leaveProjectExplainerDescription',
		defaultMessage:
			'<b>{name}</b> will no longer be able to add or exchange observations.',
		description: 'Description for leave project explanation.',
	},
	confirmButton: {
		id: 'routes.app.projects.$projectId_.settings.team.$deviceId.confirmButton',
		defaultMessage: 'Confirm',
		description: 'Button text to confirm leaving project.',
	},
})
