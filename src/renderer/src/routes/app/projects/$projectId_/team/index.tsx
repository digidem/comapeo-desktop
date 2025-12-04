import { Suspense } from 'react'
import type { MemberApi } from '@comapeo/core'
import {
	useManyMembers,
	useOwnDeviceInfo,
	useOwnRoleInProject,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DeviceIcon } from '../../-shared/device-icon'
import { ListRowLink } from '../../../-components/list-row-link'
import { DARKER_ORANGE, DARK_GREY, LIGHT_GREY } from '../../../../../colors'
import { Icon } from '../../../../../components/icon'
import { ButtonLink } from '../../../../../components/link'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon'
import {
	BLOCKED_ROLE_ID,
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	LEFT_ROLE_ID,
	MEMBER_ROLE_ID,
	memberIsActiveRemoteArchive,
	type ActiveRemoteArchiveMemberInfo,
} from '../../../../../lib/comapeo'

export const Route = createFileRoute('/app/projects/$projectId/team/')({
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
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const { projectId } = Route.useParams()

	return (
		<Stack direction="column" flex={1} overflow="auto" gap={10} padding={6}>
			<Stack direction="column" gap={4} alignItems="center">
				<Icon
					name="material-people-filled"
					size={120}
					htmlColor={DARKER_ORANGE}
				/>

				<Typography variant="h1" fontWeight={500} textAlign="center">
					{t(m.navTitle)}
				</Typography>
			</Stack>

			<Suspense
				fallback={
					<Box display="flex" flexDirection="row" justifyContent="center">
						<CircularProgress disableShrink />
					</Box>
				}
			>
				<Stack direction="column">
					<Box display="flex" flexDirection="row" justifyContent="center">
						<InviteButtonSection projectId={projectId} />
					</Box>

					<Stack
						direction="column"
						flex={1}
						justifyContent="space-between"
						paddingBlock={10}
					>
						<MembersSections projectId={projectId} />
					</Stack>
				</Stack>
			</Suspense>
		</Stack>
	)
}

function InviteButtonSection({ projectId }: { projectId: string }) {
	const { formatMessage: t } = useIntl()

	const { data: role } = useOwnRoleInProject({ projectId })

	const isAtLeastCoordinator =
		role.roleId === COORDINATOR_ROLE_ID || role.roleId === CREATOR_ROLE_ID

	if (!isAtLeastCoordinator) {
		return null
	}

	return (
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
	)
}

function MembersSections({ projectId }: { projectId: string }) {
	const { formatMessage: t } = useIntl()

	const { data: members } = useManyMembers({ projectId })
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { coordinators, participants, pastCollaborators, remoteArchives } =
		getDisplayableMembers(members)

	const sectionIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h2',
		multiplier: 1.5,
	})

	return (
		<Stack direction="column" gap={6}>
			<Stack direction="column" gap={2}>
				<Stack direction="row" gap={4} alignItems="center">
					<Icon name="material-manage-accounts-filled" size={sectionIconSize} />

					<Typography variant="h2" fontWeight={500}>
						{t(m.coordinatorsSectionTitle)}
					</Typography>
				</Stack>

				<Typography>{t(m.coordinatorsSectionDescription)}</Typography>
			</Stack>

			<ActiveCollaboratorsList
				devices={coordinators}
				ownDeviceId={ownDeviceInfo.deviceId}
				projectId={projectId}
			/>

			<Divider variant="fullWidth" sx={{ bgcolor: LIGHT_GREY }} />

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
				<ActiveCollaboratorsList
					devices={participants}
					ownDeviceId={ownDeviceInfo.deviceId}
					projectId={projectId}
				/>
			) : (
				<Typography color="textSecondary">{t(m.noParticipants)}</Typography>
			)}

			{remoteArchives[0] ? (
				<>
					<Divider variant="fullWidth" sx={{ bgcolor: LIGHT_GREY }} />

					<Stack direction="column" gap={2}>
						<Stack direction="row" gap={4} alignItems="center">
							<Icon
								name="material-offline-bolt-outlined"
								size={sectionIconSize}
							/>

							<Typography variant="h2" fontWeight={500}>
								{t(m.remoteArchivesSectionTitle)}
							</Typography>
						</Stack>

						<Typography>{t(m.remoteArchivesSectionDescription)}</Typography>
					</Stack>

					<ActiveCollaboratorsList
						// NOTE: We only surface the first one (probably will change in the future)
						devices={[remoteArchives[0]]}
						ownDeviceId={ownDeviceInfo.deviceId}
						projectId={projectId}
					/>
				</>
			) : null}

			{pastCollaborators.length > 0 ? (
				<>
					<Divider variant="fullWidth" sx={{ bgcolor: LIGHT_GREY }} />

					<Stack direction="column" gap={2}>
						<Stack direction="row" gap={4} alignItems="center">
							<Icon name="material-group-off" size={sectionIconSize} />

							<Typography variant="h2" fontWeight={500}>
								{t(m.pastCollaboratorsSectionTitle)}
							</Typography>
						</Stack>

						<Typography>{t(m.pastCollaboratorsSectionDescription)}</Typography>
					</Stack>

					<PastCollaboratorsList
						devices={pastCollaborators}
						ownDeviceId={ownDeviceInfo.deviceId}
					/>
				</>
			) : null}
		</Stack>
	)
}

function ActiveCollaboratorsList({
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
		multiplier: 1.25,
	})

	const actionIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 1.25,
	})

	return (
		<List
			disablePadding
			sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
		>
			{devices.map((device) => {
				const isSelf = device.deviceId === ownDeviceId

				const displayedName = device.name || device.deviceId.slice(0, 12)

				return (
					<ListItem key={device.deviceId} disablePadding disableGutters>
						<ListRowLink
							to="/app/projects/$projectId/team/$deviceId"
							params={{ projectId, deviceId: device.deviceId }}
							aria-label={t(m.memberLinkAccessibleLabel, {
								name: displayedName,
							})}
							label={
								isSelf ? (
									<>
										<Box component="span">{displayedName}</Box>

										<Typography
											component="span"
											color="textSecondary"
											sx={{ marginInlineStart: 4 }}
										>
											{t(m.thisDevice)}
										</Typography>
									</>
								) : (
									displayedName
								)
							}
							start={
								<DeviceIcon
									deviceType={device.deviceType}
									size={deviceIconSize}
								/>
							}
							end={
								<Icon
									name="material-chevron-right"
									htmlColor={DARK_GREY}
									size={actionIconSize}
								/>
							}
						/>
					</ListItem>
				)
			})}
		</List>
	)
}

function PastCollaboratorsList({
	devices,
	ownDeviceId,
}: {
	devices: Array<
		Pick<MemberApi.MemberInfo, 'deviceId' | 'deviceType' | 'name' | 'joinedAt'>
	>
	ownDeviceId: string
}) {
	const { formatMessage: t } = useIntl()

	const deviceIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 1.25,
	})

	return (
		<List
			disablePadding
			sx={{ display: 'flex', flexDirection: 'column', gap: 10 }}
		>
			{devices.map((device) => {
				const isSelf = device.deviceId === ownDeviceId

				const displayedName = device.name || device.deviceId.slice(0, 12)

				return (
					<ListItem key={device.deviceId} disablePadding disableGutters>
						<Stack
							direction="row"
							flex={1}
							justifyContent="space-between"
							alignItems="center"
							overflow="auto"
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
									{isSelf ? (
										<>
											<Box component="span">{displayedName}</Box>

											<Typography
												component="span"
												color="textSecondary"
												sx={{ marginInlineStart: 4 }}
											>
												{t(m.thisDevice)}
											</Typography>
										</>
									) : (
										displayedName
									)}
								</Typography>
							</Stack>
						</Stack>
					</ListItem>
				)
			})}
		</List>
	)
}

function getDisplayableMembers(members: Array<MemberApi.MemberInfo>) {
	const coordinators: Array<MemberApi.MemberInfo> = []
	const participants: Array<MemberApi.MemberInfo> = []
	const pastCollaborators: Array<MemberApi.MemberInfo> = []
	const remoteArchives: Array<ActiveRemoteArchiveMemberInfo> = []

	for (const m of members) {
		if (memberIsActiveRemoteArchive(m)) {
			remoteArchives.push(m)
		}

		// NOTE: Member is an inactive remote archive
		if (m.deviceType === 'selfHostedServer') {
			continue
		}

		switch (m.role.roleId) {
			case LEFT_ROLE_ID:
			case BLOCKED_ROLE_ID: {
				pastCollaborators.push(m)
				break
			}
			case CREATOR_ROLE_ID:
			case COORDINATOR_ROLE_ID: {
				coordinators.push(m)
				break
			}
			case MEMBER_ROLE_ID: {
				participants.push(m)
				break
			}
			default: {
				// TODO: How to handle other role types?
			}
		}
	}

	return {
		coordinators,
		participants,
		pastCollaborators,
		remoteArchives,
	}
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId_.team.index.navTitle',
		defaultMessage: 'Team',
		description: 'Title of the team page.',
	},
	inviteDevice: {
		id: 'routes.app.projects.$projectId_.team.index.inviteDevice',
		defaultMessage: 'Invite Device',
		description:
			'Text for button that initiates steps for inviting device to project.',
	},
	coordinatorsSectionTitle: {
		id: 'routes.app.projects.$projectId_.team.index.coordinatorsSectionTitle',
		defaultMessage: 'Coordinators',
		description: 'Title of the coordinators section in the team page.',
	},
	coordinatorsSectionDescription: {
		id: 'routes.app.projects.$projectId_.team.index.coordinatorsSectionDescription',
		defaultMessage:
			'Coordinators can invite devices, edit and delete data, and manage project details.',
		description: 'Description of the coordinators section in the team page.',
	},
	participantsSectionTitle: {
		id: 'routes.app.projects.$projectId_.team.index.participantsSectionTitle',
		defaultMessage: 'Participants',
		description: 'Title of the participants section in the team page.',
	},
	participantsSectionDescription: {
		id: 'routes.app.projects.$projectId_.team.index.participantsSectionDescription',
		defaultMessage:
			'Participants can take and share observations. They cannot manage users or project details.',
		description: 'Description of the participants section in the team page.',
	},
	noParticipants: {
		id: 'routes.app.projects.$projectId_.team.index.noParticipants',
		defaultMessage: 'No Participants have been added to this project.',
		description:
			'Text indicating that no participants are part of the project yet.',
	},
	remoteArchivesSectionTitle: {
		id: 'routes.app.projects.$projectId_.team.index.remoteArchivesSectionTitle',
		defaultMessage: 'Remote Archive',
		description: 'Title of the remote archives section in the team page.',
	},
	remoteArchivesSectionDescription: {
		id: 'routes.app.projects.$projectId_.team.index.remoteArchivesSectionDescription',
		defaultMessage: 'This project is sharing with a secure, encrypted server.',
		description: 'Description of the remote archives section in the team page.',
	},
	pastCollaboratorsSectionTitle: {
		id: 'routes.app.projects.$projectId_.team.index.pastCollaboratorsSectionTitle',
		defaultMessage: 'Past Collaborators',
		description: 'Title of the past collaborators section in the team page.',
	},
	pastCollaboratorsSectionDescription: {
		id: 'routes.app.projects.$projectId_.team.index.pastCollaboratorsSectionDescription',
		defaultMessage: 'Devices no longer contributing to this project.',
		description:
			'Description of the past collaborators section in the team page.',
	},
	thisDevice: {
		id: 'routes.app.projects.$projectId_.team.index.thisDevice',
		defaultMessage: 'This device',
		description:
			'Text indicating that the listed device refers to the one currently being used.',
	},
	memberLinkAccessibleLabel: {
		id: 'routes.app.projects.$projectId_.team.index.memberLinkAccessibleLabel',
		defaultMessage: 'View member {name}.',
		description: 'Accessible label for link that navigates to member details.',
	},
})
