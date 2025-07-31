import { useMemo } from 'react'
import {
	useManyMembers,
	useOwnDeviceInfo,
	useOwnRoleInProject,
} from '@comapeo/core-react'
import type { MemberInfo } from '@comapeo/core/dist/member-api'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, LIGHT_GREY } from '../../../../../colors'
import { Icon } from '../../../../../components/icon'
import { ButtonLink, TextLink } from '../../../../../components/link'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	MEMBER_ROLE_ID,
} from '../../../../../lib/comapeo'
import type { IconName } from '../../../../../types/icons.generated'

export const Route = createFileRoute('/app/projects/$projectId_/settings/team')(
	{
		loader: async ({ context, params }) => {
			const { clientApi, projectApi, queryClient } = context
			const { projectId } = params

			await Promise.all([
				// TODO: Not ideal but requires changes in @comapeo/core-react
				queryClient.ensureQueryData({
					queryKey: [
						COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
						'client',
						'device_info',
					],
					queryFn: async () => {
						return clientApi.getDeviceInfo()
					},
				}),
				// TODO: Not ideal but requires changes in @comapeo/core-react
				queryClient.ensureQueryData({
					queryKey: [
						COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
						'projects',
						projectId,
						'role',
					],
					queryFn: async () => {
						return projectApi.$getOwnRole()
					},
				}),
				// TODO: Not ideal but requires changes in @comapeo/core-react
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
		component: RouteComponent,
	},
)

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const router = useRouter()
	const { projectId } = Route.useParams()

	const { data: members } = useManyMembers({ projectId })
	const { data: role } = useOwnRoleInProject({ projectId })
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const isAtLeastCoordinator =
		role.roleId === COORDINATOR_ROLE_ID || role.roleId === CREATOR_ROLE_ID

	const coordinators = members.filter(
		(m) =>
			m.role.roleId === CREATOR_ROLE_ID ||
			m.role.roleId === COORDINATOR_ROLE_ID,
	)

	const participants = members.filter((m) => m.role.roleId === MEMBER_ROLE_ID)

	const canLeaveProject =
		coordinators.filter((c) => c.deviceId !== ownDeviceInfo.deviceId).length > 0

	const theme = useTheme()

	const sectionIconSize = useMemo(() => {
		return `calc(${theme.typography.h2.fontSize} * ${theme.typography.h2.lineHeight} * 1.5)`
	}, [theme.typography.h2.fontSize, theme.typography.h2.lineHeight])

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
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({
							to: '/app/projects/$projectId/settings',
							params: { projectId },
							replace: true,
						})
					}}
				>
					<Icon name="material-arrow-back" size={30} />
				</IconButton>

				<Typography variant="h1" fontWeight={500}>
					{t(m.navTitle)}
				</Typography>
			</Stack>

			<Stack
				direction="column"
				flex={1}
				justifyContent="space-between"
				overflow="auto"
			>
				<Box padding={6}>
					<Stack direction="column" gap={6}>
						{isAtLeastCoordinator ? (
							<Box display="flex" justifyContent="center">
								<ButtonLink
									fullWidth
									disableElevation
									size="large"
									variant="outlined"
									sx={{ maxWidth: 400 }}
									// TODO: Navigate to collaborators page
									// to="/app/projects/$projectId/settings/collaborators"
									onClick={() => {
										alert('Not implemented yet')
									}}
									params={{ projectId }}
								>
									{t(m.inviteDevice)}
								</ButtonLink>
							</Box>
						) : null}

						<Stack direction="column" gap={2}>
							<Stack direction="row" gap={4} alignItems="center">
								<Icon
									name="material-manage-accounts-filled"
									size={sectionIconSize}
								/>

								<Typography variant="h2" fontWeight={500}>
									{t(m.coordinatorsSectionTitle)}
								</Typography>
							</Stack>
							<Typography>{t(m.coordinatorsSectionDescription)}</Typography>
						</Stack>

						<DeviceList
							canLeaveProject={canLeaveProject}
							ownDeviceId={ownDeviceInfo.deviceId}
							devices={coordinators}
							projectId={projectId}
						/>

						<Stack direction="column" gap={2}>
							<Stack direction="row" gap={4} alignItems="center">
								<Icon name="material-people-filled" size={sectionIconSize} />

								<Typography variant="h2" fontWeight={500}>
									{t(m.participantsSectionTitle)}
								</Typography>
							</Stack>

							<Typography>{t(m.participantsSectionDescription)}</Typography>
						</Stack>

						{participants.length > 0 ? (
							<DeviceList
								canLeaveProject={canLeaveProject}
								devices={participants}
								ownDeviceId={ownDeviceInfo.deviceId}
								projectId={projectId}
							/>
						) : (
							<Typography color="textSecondary">
								{t(m.noParticipants)}
							</Typography>
						)}
					</Stack>
				</Box>
			</Stack>
		</Stack>
	)
}

function DeviceList({
	canLeaveProject,
	devices,
	ownDeviceId,
	projectId,
}: {
	canLeaveProject: boolean
	devices: Array<
		Pick<MemberInfo, 'deviceId' | 'deviceType' | 'name' | 'joinedAt'>
	>
	ownDeviceId: string
	projectId: string
}) {
	const { formatMessage: t, formatDate } = useIntl()

	const theme = useTheme()

	const iconSize = useMemo(() => {
		return `calc(${theme.typography.body1.fontSize} * ${theme.typography.body1.lineHeight} * 1.5)`
	}, [theme.typography.body1.fontSize, theme.typography.body1.lineHeight])

	return (
		<Stack direction="column" gap={4}>
			<Stack direction="row" gap={2} justifyContent="space-between">
				<Typography color="textSecondary">
					{t(m.deviceNameColumnTitle)}
				</Typography>

				<Typography color="textSecondary">
					{t(m.dateAddedColumnTitle)}
				</Typography>
			</Stack>

			{devices.map((device) => {
				const isSelf = device.deviceId === ownDeviceId

				return (
					<Stack
						key={device.deviceId}
						direction="row"
						gap={4}
						padding={5}
						border={`1px solid ${BLUE_GREY}`}
						borderRadius={2}
					>
						<Box
							display="flex"
							justifyContent="center"
							alignItems="center"
							borderRadius={`calc(${iconSize} * 2)`}
							bgcolor={LIGHT_GREY}
							height={`calc(${iconSize} * 2)`}
							width={`calc(${iconSize} * 2)`}
						>
							<Icon
								titleAccess={t(getIconTitleMessage(device.deviceType))}
								name={getIconNameForDeviceType(device.deviceType)}
								size={iconSize}
							/>
						</Box>

						<Stack
							direction="column"
							flex={1}
							justifyContent="space-between"
							overflow="auto"
						>
							<Typography
								fontWeight={500}
								textOverflow="ellipsis"
								whiteSpace="nowrap"
								overflow="hidden"
							>
								{device.name}
							</Typography>
							<Typography
								color="textSecondary"
								textOverflow="ellipsis"
								whiteSpace="nowrap"
								overflow="hidden"
							>
								{device.deviceId.slice(0, 12)}
							</Typography>

							{isSelf ? (
								<Typography
									color="textSecondary"
									textOverflow="ellipsis"
									whiteSpace="nowrap"
									overflow="hidden"
								>
									{t(m.thisDevice)}
								</Typography>
							) : null}
						</Stack>

						<Stack direction="column" justifyContent="space-between">
							<Typography color="textSecondary" textAlign="end">
								{device.joinedAt
									? formatDate(device.joinedAt, {
											year: 'numeric',
											month: 'short',
											day: '2-digit',
										})
									: null}
							</Typography>

							{canLeaveProject && isSelf ? (
								<TextLink
									// TODO: Navigate to leave project page
									// to="/app/projects/$projectId/settings/leave"
									params={{ projectId }}
									onClick={() => {
										alert('Not implemented yet')
									}}
									color="error"
									underline="none"
									textAlign="end"
								>
									{t(m.leaveProject)}
								</TextLink>
							) : null}
						</Stack>
					</Stack>
				)
			})}
		</Stack>
	)
}

function getIconNameForDeviceType(
	deviceType: MemberInfo['deviceType'],
): IconName {
	switch (deviceType) {
		case 'desktop': {
			return 'material-symbols-computer'
		}
		case 'tablet': {
			return 'material-tablet-android'
		}
		case 'mobile': {
			return 'material-phone-android'
		}
		case 'selfHostedServer': {
			return 'material-symbols-encrypted-weight400'
		}
		case 'UNRECOGNIZED':
		case 'device_type_unspecified':
		default: {
			return 'material-question-mark'
		}
	}
}

function getIconTitleMessage(deviceType: MemberInfo['deviceType']) {
	switch (deviceType) {
		case 'desktop': {
			return m.deviceTypeDesktop
		}
		case 'tablet': {
			return m.deviceTypeTablet
		}
		case 'mobile': {
			return m.deviceTypeMobile
		}
		case 'selfHostedServer': {
			return m.deviceTypeRemoteArchive
		}
		case 'device_type_unspecified': {
			return m.deviceTypeUnspecified
		}
		case 'UNRECOGNIZED':
		default: {
			return m.deviceTypeUnknown
		}
	}
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId_.settings.team.navTitle',
		defaultMessage: 'Team',
		description: 'Title of the project settings team page.',
	},
	inviteDevice: {
		id: 'routes.app.projects.$projectId_.settings.team.inviteDevice',
		defaultMessage: 'Invite Device',
		description:
			'Text for button that initiates steps for inviting device to project.',
	},
	coordinatorsSectionTitle: {
		id: 'routes.app.projects.$projectId_.settings.team.coordinatorsSectionTitle',
		defaultMessage: 'Coordinators',
		description: 'Title of the coordinators section in the team page.',
	},
	coordinatorsSectionDescription: {
		id: 'routes.app.projects.$projectId_.settings.team.coordinatorsSectionDescription',
		defaultMessage:
			'Coordinators can invite devices, edit and delete data, and manage project details.',
		description: 'Description of the coordinators section in the team page.',
	},
	participantsSectionTitle: {
		id: 'routes.app.projects.$projectId_.settings.team.participantsSectionTitle',
		defaultMessage: 'Participants',
		description: 'Title of the participants section in the team page.',
	},
	participantsSectionDescription: {
		id: 'routes.app.projects.$projectId_.settings.team.participantsSectionDescription',
		defaultMessage:
			'Participants can take and share observations. They cannot manage users or project details.',
		description: 'Description of the participants section in the team page.',
	},
	deviceNameColumnTitle: {
		id: 'routes.app.projects.$projectId_.settings.team.deviceNameColumnTitle',
		defaultMessage: 'Device Name',
		description:
			'Title used for column containing device name of project members.',
	},
	dateAddedColumnTitle: {
		id: 'routes.app.projects.$projectId_.settings.team.dateAddedColumnTitle',
		defaultMessage: 'Date Added',
		description:
			'Title used for column containing date added of project members.',
	},
	leaveProject: {
		id: 'routes.app.projects.$projectId_.settings.team.leaveProject',
		defaultMessage: 'Leave Project',
		description: 'Text for button that initiates steps for leaving project.',
	},
	noParticipants: {
		id: 'routes.app.projects.$projectId_.settings.team.noParticipants',
		defaultMessage: 'No Participants have been added to this project.',
		description:
			'Text indicating that no participants are part of the project yet.',
	},
	thisDevice: {
		id: 'routes.app.projects.$projectId_.settings.team.thisDevice',
		defaultMessage: 'This Device!',
		description:
			'Text indicating that the listed device refers to the one currently being used.',
	},
	deviceTypeMobile: {
		id: 'routes.app.projects.$projectId_.settings.team.deviceTypeMobile',
		defaultMessage: 'Mobile',
		description:
			'Text indicating that the member is a mobile device (displays when hovering over the icon).',
	},
	deviceTypeDesktop: {
		id: 'routes.app.projects.$projectId_.settings.team.deviceTypeDesktop',
		defaultMessage: 'Desktop',
		description:
			'Text indicating that the member is a desktop device (displays when hovering over the icon).',
	},
	deviceTypeTablet: {
		id: 'routes.app.projects.$projectId_.settings.team.deviceTypeTablet',
		defaultMessage: 'Tablet',
		description:
			'Text indicating that the member is a tablet device (displays when hovering over the icon).',
	},
	deviceTypeRemoteArchive: {
		id: 'routes.app.projects.$projectId_.settings.team.deviceTypeRemoteArchive',
		defaultMessage: 'Remote Archive',
		description:
			'Text indicating that the member is a remote archive (displays when hovering over the icon).',
	},
	deviceTypeUnspecified: {
		id: 'routes.app.projects.$projectId_.settings.team.deviceTypeUnspecified',
		defaultMessage: 'Unspecified device type',
		description:
			'Text indicating that the member device type is unspecified (displays when hovering over the icon).',
	},
	deviceTypeUnknown: {
		id: 'routes.app.projects.$projectId_.settings.team.deviceTypeUnknown',
		defaultMessage: 'Unknown device type',
		description:
			'Text indicating that the member device type is unknown (displays when hovering over the icon).',
	},
})
