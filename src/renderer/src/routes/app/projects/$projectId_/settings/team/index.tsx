import type { MemberApi } from '@comapeo/core'
import {
	useManyMembers,
	useOwnDeviceInfo,
	useOwnRoleInProject,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DeviceIcon } from '../../../-shared/device-icon'
import { BLUE_GREY, DARK_GREY } from '../../../../../../colors'
import { Icon } from '../../../../../../components/icon'
import {
	ButtonLink,
	ListItemButtonLink,
} from '../../../../../../components/link'
import { useIconSizeBasedOnTypography } from '../../../../../../hooks/icon'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	MEMBER_ROLE_ID,
} from '../../../../../../lib/comapeo'

export const Route = createFileRoute('/app/projects/$projectId/settings/team/')(
	{
		loader: async ({ context, params }) => {
			const { clientApi, projectApi, queryClient } = context
			const { projectId } = params

			await Promise.all([
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

	const sectionIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h2',
		multiplier: 1.5,
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
									variant="outlined"
									sx={{ maxWidth: 400 }}
									to="/app/projects/$projectId/invite"
									params={{ projectId }}
									startIcon={<Icon name="material-person-add" />}
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

						<MemberList
							devices={coordinators}
							ownDeviceId={ownDeviceInfo.deviceId}
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
							<MemberList
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

function MemberList({
	devices,
	ownDeviceId,
	projectId,
}: {
	devices: Array<
		Pick<MemberApi.MemberInfo, 'deviceId' | 'deviceType' | 'name' | 'joinedAt'>
	>
	ownDeviceId: string
	projectId: string
}) {
	const { formatMessage: t } = useIntl()

	const deviceIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
	})

	const actionIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 1.25,
	})

	return (
		<Stack direction="column" gap={4}>
			{devices.map((device) => {
				const isSelf = device.deviceId === ownDeviceId

				const displayedName = device.name || device.deviceId.slice(0, 12)

				return (
					<ListItemButtonLink
						key={device.deviceId}
						to="/app/projects/$projectId/settings/team/$deviceId"
						params={{ projectId, deviceId: device.deviceId }}
						disableGutters
						sx={{
							borderRadius: 2,
							border: `1px solid ${BLUE_GREY}`,
							flexGrow: 0,
						}}
					>
						<Stack
							direction="row"
							flex={1}
							justifyContent="space-between"
							alignItems="center"
							overflow="auto"
							padding={4}
						>
							<Stack
								direction="row"
								alignItems="center"
								gap={3}
								overflow="auto"
							>
								<DeviceIcon
									deviceType={device.deviceType}
									size={deviceIconSize}
								/>

								<Typography
									textOverflow="ellipsis"
									whiteSpace="nowrap"
									overflow="hidden"
									flex={1}
									fontWeight={500}
								>
									{displayedName}

									{isSelf ? (
										<Typography
											component="span"
											color="textSecondary"
											sx={{ marginInlineStart: 4 }}
										>
											{t(m.thisDevice)}
										</Typography>
									) : null}
								</Typography>
							</Stack>

							<Icon
								name="material-chevron-right"
								htmlColor={DARK_GREY}
								size={actionIconSize}
							/>
						</Stack>
					</ListItemButtonLink>
				)
			})}
		</Stack>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId_.settings.team.index.navTitle',
		defaultMessage: 'Team',
		description: 'Title of the project settings team page.',
	},
	inviteDevice: {
		id: 'routes.app.projects.$projectId_.settings.team.index.inviteDevice',
		defaultMessage: 'Invite Device',
		description:
			'Text for button that initiates steps for inviting device to project.',
	},
	coordinatorsSectionTitle: {
		id: 'routes.app.projects.$projectId_.settings.team.index.coordinatorsSectionTitle',
		defaultMessage: 'Coordinators',
		description: 'Title of the coordinators section in the team page.',
	},
	coordinatorsSectionDescription: {
		id: 'routes.app.projects.$projectId_.settings.team.index.coordinatorsSectionDescription',
		defaultMessage:
			'Coordinators can invite devices, edit and delete data, and manage project details.',
		description: 'Description of the coordinators section in the team page.',
	},
	participantsSectionTitle: {
		id: 'routes.app.projects.$projectId_.settings.team.index.participantsSectionTitle',
		defaultMessage: 'Participants',
		description: 'Title of the participants section in the team page.',
	},
	participantsSectionDescription: {
		id: 'routes.app.projects.$projectId_.settings.team.index.participantsSectionDescription',
		defaultMessage:
			'Participants can take and share observations. They cannot manage users or project details.',
		description: 'Description of the participants section in the team page.',
	},
	noParticipants: {
		id: 'routes.app.projects.$projectId_.settings.team.index.noParticipants',
		defaultMessage: 'No Participants have been added to this project.',
		description:
			'Text indicating that no participants are part of the project yet.',
	},
	thisDevice: {
		id: 'routes.app.projects.$projectId_.settings.team.index.thisDevice',
		defaultMessage: 'This Device',
		description:
			'Text indicating that the listed device refers to the one currently being used.',
	},
})
