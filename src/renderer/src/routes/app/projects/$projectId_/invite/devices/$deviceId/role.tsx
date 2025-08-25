import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DeviceRow } from '../-shared/device-row'
import { BLUE_GREY } from '../../../../../../../colors'
import { GenericRoutePendingComponent } from '../../../../../../../components/generic-route-pending-component'
import { Icon } from '../../../../../../../components/icon'
import { useLocalPeers } from '../../../../../../../hooks/peers'

export const Route = createFileRoute(
	'/app/projects/$projectId_/invite/devices/$deviceId/role',
)({
	pendingComponent: GenericRoutePendingComponent,
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const router = useRouter()
	const navigate = useNavigate()

	const { peerOnLoad } = Route.useRouteContext()
	const { projectId, deviceId } = Route.useParams()

	const updatedPeer = useLocalPeers().find((p) => p.deviceId === deviceId)

	const peer = updatedPeer || peerOnLoad

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
							to: '/app/projects/$projectId/invite/devices',
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

			<Stack direction="column" flex={1} overflow="auto" padding={6} gap={6}>
				<Box border={`1px solid ${BLUE_GREY}`} borderRadius={2}>
					<DeviceRow
						deviceId={peer.deviceId}
						deviceType={peer.deviceType}
						name={peer.name}
						disconnected={peer.status === 'disconnected'}
					/>
				</Box>

				<Typography variant="h2" fontWeight={500}>
					{t(m.selectingRole)}
				</Typography>

				<List
					disablePadding
					sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}
				>
					<RoleOption
						name={t(m.participantTitle)}
						description={t(m.participantDescription)}
						icon={<Icon name="material-people-filled" />}
						onClick={() => {
							navigate({
								to: '/app/projects/$projectId/invite/devices/$deviceId/send',
								params: { projectId, deviceId: peer.deviceId },
								search: { role: 'participant' },
							})
						}}
					/>

					<RoleOption
						name={t(m.coordinatorTitle)}
						description={t(m.coordinatorDescription)}
						icon={<Icon name="material-manage-accounts-filled" />}
						onClick={() => {
							navigate({
								to: '/app/projects/$projectId/invite/devices/$deviceId/send',
								params: { projectId, deviceId: peer.deviceId },
								search: { role: 'coordinator' },
							})
						}}
					/>
				</List>
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
		<ListItem
			disableGutters
			disablePadding
			sx={{ borderRadius: 2, border: `1px solid ${BLUE_GREY}` }}
		>
			<ListItemButton
				disableGutters
				disableTouchRipple
				sx={{ padding: 0 }}
				onClick={onClick}
			>
				<Stack direction="column" padding={6} gap={4}>
					<Stack direction="row" alignItems="center" gap={3}>
						{icon}

						<Typography fontWeight={500}>{name}</Typography>
					</Stack>
					<Typography>{description}</Typography>
				</Stack>
			</ListItemButton>
		</ListItem>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.role.navTitle',
		defaultMessage: 'Select a Role',
		description: 'Title of the invite role selection page.',
	},
	selectingRole: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.role.selectingRole',
		defaultMessage: 'You are selecting a role for this device:',
		description: 'Description of action being taken in role selection page.',
	},
	participantTitle: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.role.participantTitle',
		defaultMessage: 'Participant',
		description: 'Participant role name.',
	},
	participantDescription: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.role.participantDescription',
		defaultMessage:
			'As a Participant this device can take and share observations. They cannot manage users or project details.',
		description: 'Participant role description.',
	},
	coordinatorTitle: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.role.coordinatorTitle',
		defaultMessage: 'Coordinator',
		description: 'Coordinator role name.',
	},
	coordinatorDescription: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.role.coordinatorDescription',
		defaultMessage:
			'As a Coordinator this device can invite and remove users, and manage project details.',
		description: 'Coordinator role description.',
	},
})
