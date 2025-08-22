import { Suspense } from 'react'
import { useManyMembers } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { NetworkConnectionInfo } from '../../../-shared/network-connection-info'
import { BLUE_GREY, LIGHT_GREY } from '../../../../../../colors'
import { Icon } from '../../../../../../components/icon'
import { useInitiallyConnectedPeers } from '../../../../../../hooks/peers'
import { DeviceRow } from './-shared/device-row'

export const Route = createFileRoute(
	'/app/projects/$projectId_/invite/devices/',
)({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const router = useRouter()
	const { projectId } = Route.useParams()

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
				padding={6}
				gap={6}
			>
				<Stack
					direction="column"
					borderRadius={2}
					border={`1px solid ${BLUE_GREY}`}
				>
					<Box
						display="flex"
						flex={1}
						flexDirection="row"
						justifyContent="center"
						alignItems="center"
						padding={4}
						overflow="auto"
					>
						<Suspense
							fallback={
								<Typography fontWeight={500}>{t(m.gettingWifiInfo)}</Typography>
							}
						>
							<NetworkConnectionInfo waitingText={t(m.gettingWifiInfo)} />
						</Suspense>
					</Box>

					<Divider sx={{ bgcolor: LIGHT_GREY }} />

					<Stack direction="column" padding={6}>
						<Typography>Not seeing a device?</Typography>

						<List sx={{ listStyleType: 'disc', paddingInline: 8 }}>
							<ListItem disablePadding sx={{ display: 'list-item' }}>
								<Typography color="textPrimary" variant="body2">
									Check that devices are on the same Wi-Fi network
								</Typography>
							</ListItem>

							<ListItem disablePadding sx={{ display: 'list-item' }}>
								<Typography variant="body2" color="textPrimary">
									Confirm that devices are using the same version of CoMapeo
								</Typography>
							</ListItem>
						</List>
					</Stack>
				</Stack>

				<Stack direction="column" flex={1}>
					<Suspense>
						<InvitablePeersList projectId={projectId} />
					</Suspense>
				</Stack>
			</Stack>
		</Stack>
	)
}

function InvitablePeersList({ projectId }: { projectId: string }) {
	const navigate = useNavigate()

	const { data: members } = useManyMembers({ projectId })

	const peers = useInitiallyConnectedPeers()

	const invitablePeers = peers.filter((peer) => {
		const existingMember = members.find(
			(member) => member.deviceId === peer.deviceId,
		)

		if (!existingMember) {
			return true
		}

		return false
	})

	return (
		<List
			disablePadding
			sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}
		>
			{invitablePeers.map((peer) => (
				<ListItem
					key={peer.deviceId}
					disableGutters
					disablePadding
					sx={{ borderRadius: 2, border: `1px solid ${BLUE_GREY}` }}
				>
					<ListItemButton
						disableGutters
						disableTouchRipple
						aria-disabled={peer.status === 'disconnected' ? true : undefined}
						onClick={
							peer.status === 'connected'
								? () => {
										navigate({
											to: '/app/projects/$projectId/invite/devices/$deviceId/role',
											params: { projectId, deviceId: peer.deviceId },
										})
									}
								: undefined
						}
						sx={{ padding: 0 }}
					>
						<DeviceRow
							deviceId={peer.deviceId}
							deviceType={peer.deviceType}
							name={peer.name}
							disconnected={peer.status === 'disconnected'}
						/>
					</ListItemButton>
				</ListItem>
			))}
		</List>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId_.invite.devices.index.navTitle',
		defaultMessage: 'Select a Device',
		description: 'Title of the device selection for invite page.',
	},
	gettingWifiInfo: {
		id: 'routes.app.projects.$projectId_.invite.devices.index.gettingWifiInfo',
		defaultMessage: 'Getting Wi-Fi information…',
		description: 'Text displayed when waiting for Wi-Fi information.',
	},
})
