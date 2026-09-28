import { Suspense } from 'react'
import type { MemberApi } from '@comapeo/core'
import {
	useManyMembers,
	useOwnDeviceInfo,
	useOwnRoleInProject,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DeviceIcon } from '../../-shared/device-icon.tsx'
import { ListRowLink } from '../../../-components/list-row-link.tsx'
import {
	BLUE_GREY,
	DARK_GREY,
	LIGHT_COMAPEO_BLUE,
	LIGHT_GREY,
} from '../../../../../colors.ts'
import { Icon } from '../../../../../components/icon.tsx'
import { ButtonLink } from '../../../../../components/link.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon.ts'
import {
	BLOCKED_ROLE_ID,
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	LEFT_ROLE_ID,
	MEMBER_ROLE_ID,
	memberIsRemoteArchive,
	type RemoteArchiveMemberInfo,
} from '../../../../../lib/comapeo.ts'

export const Route = createFileRoute('/app/projects/$projectId/team/')({
	loader: async ({ context, params }) => {
		const { clientApi, projectApi, queryClient } = context
		const { projectId } = params

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
					'role',
				],
				queryFn: async () => {
					return projectApi.$getOwnRole()
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
	component: RouteComponent,
})

function RouteComponent() {
	const intl = useIntl()

	const { projectId } = Route.useParams()

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				component="header"
				direction="row"
				sx={{
					alignItems: 'center',
					borderBottom: `1px solid ${BLUE_GREY}`,
					gap: 4,
					flexWrap: 'wrap',
					padding: 4,
				}}
			>
				<Stack direction="row" sx={{ alignItems: 'center', flex: 1, gap: 4 }}>
					<Typography variant="h1" sx={{ fontWeight: 500 }}>
						{intl.formatMessage(m.navTitle)}
					</Typography>

					<Suspense>
						<MembersCountPill projectId={projectId} />
					</Suspense>
				</Stack>

				<InviteButton projectId={projectId} />
			</Stack>

			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Container
					disableGutters
					maxWidth="sm"
					sx={{ flex: 1, paddingBlock: 6, paddingInline: 4 }}
				>
					<Suspense
						fallback={
							<Box
								sx={{ display: 'grid', height: '100%', placeItems: 'center' }}
							>
								<CircularProgress disableShrink />
							</Box>
						}
					>
						<MembersSections projectId={projectId} />
					</Suspense>
				</Container>
			</Stack>
		</Stack>
	)
}

function MembersCountPill({ projectId }: { projectId: string }) {
	const intl = useIntl()

	const { data: members } = useManyMembers({ projectId })

	return (
		<Box
			sx={{ backgroundColor: LIGHT_COMAPEO_BLUE, borderRadius: 2, padding: 1 }}
		>
			<Typography
				data-testid="exchange-network-connection-info"
				variant="body2"
				color="textSecondary"
				sx={{ whiteSpace: 'nowrap' }}
			>
				{intl.formatMessage(m.membersCount, {
					count: members.length,
				})}
			</Typography>
		</Box>
	)
}

function InviteButton({ projectId }: { projectId: string }) {
	const intl = useIntl()

	const { data: role } = useOwnRoleInProject({ projectId })

	const isAtLeastCoordinator =
		role.roleId === COORDINATOR_ROLE_ID || role.roleId === CREATOR_ROLE_ID

	if (!isAtLeastCoordinator) {
		return null
	}

	return (
		<ButtonLink
			variant="outlined"
			to="/app/projects/$projectId/team/invite"
			params={{ projectId }}
			startIcon={<Icon name="material-symbols-add-circle-outline" />}
		>
			{intl.formatMessage(m.inviteDevice)}
		</ButtonLink>
	)
}

function MembersSections({ projectId }: { projectId: string }) {
	const intl = useIntl()

	const { data: members } = useManyMembers({ projectId, includeLeft: true })
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { coordinators, participants, pastCollaborators, remoteArchives } =
		getDisplayableMembers(members)

	const sectionIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 1,
	})

	return (
		<Stack direction="column" sx={{ gap: 6 }}>
			<Stack direction="column" sx={{ gap: 2 }}>
				<Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
					<Icon name="material-manage-accounts-filled" size={sectionIconSize} />

					<Typography component="h2" sx={{ textTransform: 'uppercase' }}>
						{intl.formatMessage(m.coordinatorsSectionTitle)}
					</Typography>
				</Stack>

				<Typography color="textSecondary">
					{intl.formatMessage(m.coordinatorsSectionDescription)}
				</Typography>
			</Stack>

			<ActiveCollaboratorsList
				devices={coordinators}
				ownDeviceId={ownDeviceInfo.deviceId}
				projectId={projectId}
			/>

			<Divider variant="fullWidth" sx={{ bgcolor: LIGHT_GREY }} />

			<Stack direction="column" sx={{ gap: 2 }}>
				<Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
					<Icon name="material-people-filled" size={sectionIconSize} />

					<Typography component="h2" sx={{ textTransform: 'uppercase' }}>
						{intl.formatMessage(m.participantsSectionTitle)}
					</Typography>
				</Stack>

				<Typography color="textSecondary">
					{intl.formatMessage(m.participantsSectionDescription)}
				</Typography>
			</Stack>

			{participants.length > 0 ? (
				<ActiveCollaboratorsList
					devices={participants}
					ownDeviceId={ownDeviceInfo.deviceId}
					projectId={projectId}
				/>
			) : (
				<Typography color="textSecondary">
					{intl.formatMessage(m.noParticipants)}
				</Typography>
			)}

			{remoteArchives.length > 0 ? (
				<>
					<Divider variant="fullWidth" sx={{ bgcolor: LIGHT_GREY }} />

					<Stack direction="column" sx={{ gap: 2 }}>
						<Stack direction="row" sx={{ gap: 4, alignItems: 'center' }}>
							<Icon
								name="material-offline-bolt-outlined"
								size={sectionIconSize}
							/>

							<Typography variant="h2" sx={{ textTransform: 'uppercase' }}>
								{intl.formatMessage(m.remoteArchivesSectionTitle)}
							</Typography>
						</Stack>

						<Typography color="textSecondary">
							{intl.formatMessage(m.remoteArchivesSectionDescription)}
						</Typography>
					</Stack>

					<ActiveCollaboratorsList
						devices={remoteArchives}
						ownDeviceId={ownDeviceInfo.deviceId}
						projectId={projectId}
					/>
				</>
			) : null}

			{pastCollaborators.length > 0 ? (
				<>
					<Divider variant="fullWidth" sx={{ bgcolor: LIGHT_GREY }} />

					<Stack direction="column" sx={{ gap: 2 }}>
						<Stack direction="row" sx={{ gap: 4, alignItems: 'center' }}>
							<Icon name="material-group-off" size={sectionIconSize} />

							<Typography component="h2" sx={{ textTransform: 'uppercase' }}>
								{intl.formatMessage(m.pastCollaboratorsSectionTitle)}
							</Typography>
						</Stack>

						<Typography color="textSecondary">
							{intl.formatMessage(m.pastCollaboratorsSectionDescription)}
						</Typography>
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
	const intl = useIntl()

	const deviceIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 1.25,
	})

	const actionIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 2,
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
							aria-label={intl.formatMessage(m.memberLinkAccessibleLabel, {
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
											{intl.formatMessage(m.thisDevice)}
										</Typography>
									</>
								) : (
									displayedName
								)
							}
							start={
								<Box sx={{ display: 'grid', padding: 2, placeItems: 'center' }}>
									<DeviceIcon
										deviceType={device.deviceType}
										size={deviceIconSize}
									/>
								</Box>
							}
							end={
								<Icon
									name="material-chevron-right-rounded"
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
	const intl = useIntl()

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
							sx={{
								flex: 1,
								justifyContent: 'space-between',
								alignItems: 'center',
								overflow: 'auto',
							}}
						>
							<Stack
								direction="row"
								sx={{ alignItems: 'center', gap: 3, overflow: 'auto' }}
							>
								<Box
									sx={{
										display: 'grid',
										opacity: 0.5,
										padding: 2,
										placeItems: 'center',
									}}
								>
									<DeviceIcon
										deviceType={device.deviceType}
										size={deviceIconSize}
									/>
								</Box>

								<Typography
									sx={{
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										flex: 1,
										fontWeight: 500,
									}}
								>
									{isSelf ? (
										<>
											<Box component="span">{displayedName}</Box>

											<Typography
												component="span"
												color="textSecondary"
												sx={{ marginInlineStart: 4 }}
											>
												{intl.formatMessage(m.thisDevice)}
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
	const pastCollaborators: Array<
		MemberApi.MemberInfo | RemoteArchiveMemberInfo
	> = []
	const remoteArchives: Array<RemoteArchiveMemberInfo> = []

	for (const m of members) {
		if (memberIsRemoteArchive(m)) {
			if (m.role.roleId === LEFT_ROLE_ID || m.role.roleId === BLOCKED_ROLE_ID) {
				pastCollaborators.push(m)
			} else {
				remoteArchives.push(m)
			}

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

	return { coordinators, participants, pastCollaborators, remoteArchives }
}

const m = defineMessages({
	navTitle: {
		id: '$1.routes.app.projects.$projectId.team.index.navTitle',
		defaultMessage: 'Team',
		description: 'Title of the team page.',
	},
	membersCount: {
		id: '$1.routes.app.projects.$projectId.team.index.membersCount',
		defaultMessage:
			'{count, plural, =0 {No members} one {# member} other {# members}}',
		description: 'Title of the team page.',
	},
	inviteDevice: {
		id: '$1.routes.app.projects.$projectId.team.index.inviteDevice',
		defaultMessage: 'Invite Device',
		description:
			'Text for button that initiates steps for inviting device to project.',
	},
	coordinatorsSectionTitle: {
		id: '$1.routes.app.projects.$projectId.team.index.coordinatorsSectionTitle',
		defaultMessage: 'Coordinators',
		description: 'Title of the coordinators section in the team page.',
	},
	coordinatorsSectionDescription: {
		id: '$1.routes.app.projects.$projectId.team.index.coordinatorsSectionDescription',
		defaultMessage:
			'Coordinators can invite devices, edit and delete data, and manage project details.',
		description: 'Description of the coordinators section in the team page.',
	},
	participantsSectionTitle: {
		id: '$1.routes.app.projects.$projectId.team.index.participantsSectionTitle',
		defaultMessage: 'Participants',
		description: 'Title of the participants section in the team page.',
	},
	participantsSectionDescription: {
		id: '$1.routes.app.projects.$projectId.team.index.participantsSectionDescription',
		defaultMessage:
			'Participants can take and share observations. They cannot manage users or project details.',
		description: 'Description of the participants section in the team page.',
	},
	noParticipants: {
		id: '$1.routes.app.projects.$projectId.team.index.noParticipants',
		defaultMessage: 'No Participants have been added to this project.',
		description:
			'Text indicating that no participants are part of the project yet.',
	},
	remoteArchivesSectionTitle: {
		id: '$1.routes.app.projects.$projectId.team.index.remoteArchivesSectionTitle',
		defaultMessage: 'Remote Archives',
		description: 'Title of the remote archives section in the team page.',
	},
	remoteArchivesSectionDescription: {
		id: '$1.routes.app.projects.$projectId.team.index.remoteArchivesSectionDescription',
		defaultMessage: 'This project is sharing with secure, encrypted servers.',
		description: 'Description of the remote archives section in the team page.',
	},
	pastCollaboratorsSectionTitle: {
		id: '$1.routes.app.projects.$projectId.team.index.pastCollaboratorsSectionTitle',
		defaultMessage: 'Past Collaborators',
		description: 'Title of the past collaborators section in the team page.',
	},
	pastCollaboratorsSectionDescription: {
		id: '$1.routes.app.projects.$projectId.team.index.pastCollaboratorsSectionDescription',
		defaultMessage: 'Devices no longer contributing to this project.',
		description:
			'Description of the past collaborators section in the team page.',
	},
	thisDevice: {
		id: '$1.routes.app.projects.$projectId.team.index.thisDevice',
		defaultMessage: 'This device',
		description:
			'Text indicating that the listed device refers to the one currently being used.',
	},
	memberLinkAccessibleLabel: {
		id: 'routes.app.projects.$projectId.team.index.memberLinkAccessibleLabel',
		defaultMessage: 'View member {name}.',
		description: 'Accessible label for link that navigates to member details.',
	},
})
