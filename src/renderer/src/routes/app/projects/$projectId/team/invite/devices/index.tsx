import { Suspense, type ReactNode } from 'react'
import { useManyMembers } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import {
	BLACK,
	BLUE_GREY,
	LIGHT_COMAPEO_BLUE,
	LIGHT_GREY,
} from '../../../../../../../colors.ts'
import { Icon } from '../../../../../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../../../hooks/icon.ts'
import { useBrowserNetInfo } from '../../../../../../../hooks/network.ts'
import { useInitiallyConnectedPeers } from '../../../../../../../hooks/peers.ts'
import {
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	MEMBER_ROLE_ID,
} from '../../../../../../../lib/comapeo.ts'
import { getWifiConnectionsOptions } from '../../../../../../../lib/queries/system.ts'
import { DeviceRow } from './-shared/device-row.tsx'

export const Route = createFileRoute(
	'/app/projects/$projectId/team/invite/devices/',
)({
	component: RouteComponent,
})

function RouteComponent() {
	const intl = useIntl()

	const router = useRouter()

	const { projectId } = Route.useParams()

	const backIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 1.25,
	})

	return (
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
							to: '/app/projects/$projectId/settings',
							params: { projectId },
							replace: true,
						})
					}}
				>
					<Icon
						name="material-arrow-back"
						htmlColor={BLACK}
						size={backIconSize}
					/>
				</IconButton>

				<Typography variant="h1" sx={{ fontWeight: 500 }}>
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
						paddingBlock: 6,
						paddingInline: 4,
					}}
				>
					<Stack direction="column" sx={{ flex: 1, gap: 10 }}>
						<Stack
							direction="column"
							sx={{ borderRadius: 2, border: `1px solid ${BLUE_GREY}` }}
						>
							<NetworkConnectionInfo />

							<Divider sx={{ bgcolor: LIGHT_GREY }} />

							<Stack direction="column" sx={{ padding: 6 }}>
								<Typography>
									{intl.formatMessage(m.discoveryTroubleshootingTitle)}
								</Typography>

								<List sx={{ listStyleType: 'disc', paddingInline: 8 }}>
									<ListItem disablePadding sx={{ display: 'list-item' }}>
										<Typography color="textPrimary" variant="body2">
											{intl.formatMessage(
												m.discoveryTroubleshootingSameNetwork,
											)}
										</Typography>
									</ListItem>

									<ListItem disablePadding sx={{ display: 'list-item' }}>
										<Typography variant="body2" color="textPrimary">
											{intl.formatMessage(
												m.discoveryTroubleshootingSameVersion,
											)}
										</Typography>
									</ListItem>
								</List>
							</Stack>
						</Stack>

						<Stack direction="column" sx={{ flex: 1 }}>
							<Suspense>
								<InvitablePeersList projectId={projectId} />
							</Suspense>
						</Stack>
					</Stack>
				</Container>
			</Stack>
		</Stack>
	)
}

function InvitablePeersList({ projectId }: { projectId: string }) {
	const navigate = useNavigate()

	const { data: members } = useManyMembers({ projectId, includeLeft: true })

	const peers = useInitiallyConnectedPeers()

	const invitablePeers = peers.filter((peer) => {
		const existingMember = members.find(
			(member) => member.deviceId === peer.deviceId,
		)

		if (!existingMember) {
			return true
		}

		if (
			existingMember.role.roleId === CREATOR_ROLE_ID ||
			existingMember.role.roleId === COORDINATOR_ROLE_ID ||
			existingMember.role.roleId === MEMBER_ROLE_ID
		) {
			return false
		}

		// NOTE: Members that do not have a role associated with being an "active" member can be reinvited.
		return true
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
											to: '/app/projects/$projectId/team/invite/devices/$deviceId/role',
											params: { projectId, deviceId: peer.deviceId },
											replace: true,
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

function NetworkConnectionInfo() {
	const intl = useIntl()

	const wifiConnectionQuery = useQuery({
		...getWifiConnectionsOptions(),
		select: (connections) => {
			return connections[0]
		},
		refetchOnWindowFocus: false,
	})

	const browserNetInfo = useBrowserNetInfo()

	let displayedContent: ReactNode

	const wifiIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 0.8,
	})

	if (
		wifiConnectionQuery.status === 'pending' ||
		wifiConnectionQuery.isRefetching
	) {
		displayedContent = (
			<Typography sx={{ fontWeight: 500 }}>
				{intl.formatMessage(m.gettingWifiInfo)}
			</Typography>
		)
	} else {
		displayedContent = (
			<>
				<WifiIcon
					offline={!(browserNetInfo.online || wifiConnectionQuery.data)}
					size={wifiIconSize}
				/>

				<Typography sx={{ fontWeight: 500 }}>
					{wifiConnectionQuery.data &&
					// NOTE: Issue with systeminformation module on macOS >=15.6 (https://github.com/digidem/comapeo-desktop/issues/378)
					wifiConnectionQuery.data.ssid !== '&lt;redacted&gt;' &&
					wifiConnectionQuery.data.ssid !== '<redacted>'
						? // eslint-disable-next-line formatjs/no-literal-string-in-jsx
							`${wifiConnectionQuery.data.ssid}${
								browserNetInfo.effectiveType
									? // TODO: Should the effectiveType be translatable?
										` - ${browserNetInfo.effectiveType}`
									: undefined
							}`
						: intl.formatMessage(m.wifiInfoUnavailable)}
				</Typography>
			</>
		)
	}

	return (
		<Box
			sx={{
				alignItems: 'center',
				display: 'flex',
				flex: 1,
				flexDirection: 'row',
				justifyContent: 'center',
				overflow: 'auto',
				padding: 4,
			}}
		>
			<Stack
				data-testid="invite-devices-list-network-connection-info"
				direction="row"
				sx={{
					gap: 3,
					alignItems: 'center',
					justifyContent: 'center',
					overflow: 'auto',
				}}
			>
				{displayedContent}
			</Stack>
		</Box>
	)
}

function WifiIcon({
	offline,
	size,
}: {
	offline?: boolean
	size?: string | number
}) {
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				borderRadius: '50%',
				padding: 1,
				bgcolor: LIGHT_COMAPEO_BLUE,
			}}
		>
			<Icon
				name={offline ? 'material-wifi-off' : 'material-wifi'}
				size={size}
			/>
		</Box>
	)
}

const m = defineMessages({
	navTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.index.navTitle',
		defaultMessage: 'Select a Device',
		description: 'Title of the device selection for invite page.',
	},
	gettingWifiInfo: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.index.gettingWifiInfo',
		defaultMessage: 'Getting Wi-Fi information…',
		description: 'Text displayed when waiting for Wi-Fi information.',
	},
	wifiInfoUnavailable: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.index.wifiInfoUnavailable',
		defaultMessage: 'Wi-Fi info unavailable',
		description: 'Text displayed when Wi-Fi info is unavailable.',
	},
	discoveryTroubleshootingTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.index.discoveryTroubleshootingTitle',
		defaultMessage: 'Not seeing a device?',
		description: 'Title for device discovery troubleshooting section.',
	},
	discoveryTroubleshootingSameNetwork: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.index.discoveryTroubleshootingSameNetwork',
		defaultMessage: 'Check that devices are on the same Wi-Fi network',
		description:
			'Text explaining that devices need to be on same Wi-Fi network.',
	},
	discoveryTroubleshootingSameVersion: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.index.discoveryTroubleshootingSameVersion',
		defaultMessage:
			'Confirm that devices are using the same version of CoMapeo',
		description:
			'Text explaining that devices need to be using same version of CoMapeo.',
	},
	goBackAccessibleLabel: {
		id: 'routes.app.projects.$projectId.team.invite.devices.index.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button',
	},
})
