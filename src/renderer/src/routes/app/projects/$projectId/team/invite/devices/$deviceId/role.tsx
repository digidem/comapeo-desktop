import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DeviceRow } from '../-shared/device-row.tsx'
import { BLUE_GREY } from '../../../../../../../../colors.ts'
import { GenericRoutePendingComponent } from '../../../../../../../../components/generic-route-pending-component.tsx'
import { Icon } from '../../../../../../../../components/icon.tsx'
import { useLocalPeersState } from '../../../../../../../../contexts/local-peers-store-context.ts'
import { useIconSizeBasedOnTypography } from '../../../../../../../../hooks/icon.ts'

export const Route = createFileRoute(
	'/app/projects/$projectId/team/invite/devices/$deviceId/role',
)({ pendingComponent: GenericRoutePendingComponent, component: RouteComponent })

function RouteComponent() {
	const intl = useIntl()

	const router = useRouter()
	const navigate = useNavigate()

	const { peerOnLoad } = Route.useRouteContext()
	const { projectId, deviceId } = Route.useParams()

	const updatedPeer = useLocalPeersState((peers) => {
		return peers.find((p) => p.deviceId === deviceId)
	})

	const peer = updatedPeer || peerOnLoad

	const backIconSize = useIconSizeBasedOnTypography({
		variant: 'pageTitle',
		multiplier: 1.25,
	})

	const roleIconSize = useIconSizeBasedOnTypography({
		variant: 'cardHeader',
		multiplier: 1.5,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				component="header"
				direction="row"
				sx={{
					alignItems: 'center',
					borderBottom: `1px solid ${BLUE_GREY}`,
					gap: 2,
					paddingBlock: 4,
					paddingInline: 6,
				}}
			>
				<IconButton
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({
							to: '/app/projects/$projectId/team/invite/devices',
							params: { projectId },
							replace: true,
						})
					}}
				>
					<Icon name="material-arrow-back" size={backIconSize} />
				</IconButton>

				<Typography variant="pageTitle">
					{intl.formatMessage(m.navTitle)}
				</Typography>
			</Stack>

			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Container
					maxWidth="sm"
					sx={{
						display: 'flex',
						flex: 1,
						flexDirection: 'column',
						gap: 6,
						paddingBlock: 6,
						paddingInline: 4,
					}}
				>
					<Box sx={{ border: `1px solid ${BLUE_GREY}`, borderRadius: 2 }}>
						<DeviceRow
							deviceId={peer.deviceId}
							deviceType={peer.deviceType}
							name={peer.name}
							disconnected={peer.status === 'disconnected'}
						/>
					</Box>

					<Typography
						component="h2"
						sx={{ fontWeight: (theme) => theme.typography.fontWeightMedium }}
					>
						{intl.formatMessage(m.selectingRole)}
					</Typography>

					<Stack component={List} direction="column" sx={{ gap: 5 }}>
						<RoleOption
							name={intl.formatMessage(m.participantTitle)}
							description={intl.formatMessage(m.participantDescription)}
							icon={<Icon name="material-people-filled" size={roleIconSize} />}
							onClick={() => {
								navigate({
									to: '/app/projects/$projectId/team/invite/devices/$deviceId/send',
									params: { projectId, deviceId: peer.deviceId },
									search: { role: 'participant' },
									replace: true,
								})
							}}
						/>

						<RoleOption
							name={intl.formatMessage(m.coordinatorTitle)}
							description={intl.formatMessage(m.coordinatorDescription)}
							icon={
								<Icon
									name="material-manage-accounts-filled"
									size={roleIconSize}
								/>
							}
							onClick={() => {
								navigate({
									to: '/app/projects/$projectId/team/invite/devices/$deviceId/send',
									params: { projectId, deviceId: peer.deviceId },
									search: { role: 'coordinator' },
									replace: true,
								})
							}}
						/>
					</Stack>
				</Container>
			</Stack>
		</Stack>
	)
}

function RoleOption({
	name,
	description,
	icon,
	onClick,
}: {
	name: string
	description: string
	icon: ReactNode
	onClick?: () => void
}) {
	return (
		<ListItem sx={{ border: `1px solid ${BLUE_GREY}`, borderRadius: 2 }}>
			<ListItemButton
				disableGutters
				disableTouchRipple
				sx={{ padding: 0 }}
				onClick={onClick}
			>
				<Stack direction="column" sx={{ gap: 4, padding: 6 }}>
					<Stack direction="row" sx={{ alignItems: 'center', gap: 3 }}>
						{icon}

						<Typography variant="cardHeader">{name}</Typography>
					</Stack>

					<Typography>{description}</Typography>
				</Stack>
			</ListItemButton>
		</ListItem>
	)
}

const m = defineMessages({
	navTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.role.navTitle',
		defaultMessage: 'Select a Role',
		description: 'Title of the invite role selection page.',
	},
	selectingRole: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.role.selectingRole',
		defaultMessage: 'You are selecting a role for this device:',
		description: 'Description of action being taken in role selection page.',
	},
	participantTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.role.participantTitle',
		defaultMessage: 'Participant',
		description: 'Participant role name.',
	},
	participantDescription: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.role.participantDescription',
		defaultMessage:
			'As a Participant this device can take and share observations. They cannot manage users or project details.',
		description: 'Participant role description.',
	},
	coordinatorTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.role.coordinatorTitle',
		defaultMessage: 'Coordinator',
		description: 'Coordinator role name.',
	},
	coordinatorDescription: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.role.coordinatorDescription',
		defaultMessage:
			'As a Coordinator this device can invite and remove users, and manage project details.',
		description: 'Coordinator role description.',
	},
})
