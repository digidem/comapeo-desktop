import { Suspense } from 'react'
import {
	useDataSyncProgress,
	useManyMembers,
	useOwnDeviceInfo,
	useStartSync,
	useStopSync,
	useSyncState,
	type SyncState,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import LinearProgress, {
	type LinearProgressProps,
} from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { captureException } from '@sentry/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import {
	BLACK_00,
	BLUE_05,
	BLUE_06,
	ORANGE_00,
	WHITE_00,
} from '../../../../../../../shared/colors.ts'
import { DecentDialog } from '../../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../../components/error-dialog.tsx'
import { Icon } from '../../../../../components/icon.tsx'
import { ButtonLink } from '../../../../../components/link.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon.ts'
import { useBrowserNetInfo } from '../../../../../hooks/network.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	MEMBER_ROLE_ID,
	memberIsRemoteArchive,
} from '../../../../../lib/comapeo.ts'
import { ExhaustivenessError } from '../../../../../lib/exhaustiveness-error.ts'
import { getWifiConnectionsOptions } from '../../../../../lib/queries/system.ts'
import {
	deriveSyncStage,
	getConnectedPeersCount,
	getSyncingPeersCount,
	type SyncStage,
} from '../../../../../lib/sync.ts'

export const Route = createFileRoute('/app/projects/$projectId/exchange/')({
	loader: async ({ context, params }) => {
		const { queryClient, projectApi } = context
		const { projectId } = params

		await Promise.all([
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
	onEnter: ({ context }) => {
		context.projectApi.$sync
			.setAutostopDataSyncTimeout(null)
			.catch(captureException)
	},
	onLeave: ({ context }) => {
		context.projectApi.$sync
			.setAutostopDataSyncTimeout(30_000)
			.catch(captureException)
	},
	component: RouteComponent,
})

function RouteComponent() {
	const intl = useIntl()

	const { projectId } = Route.useParams()

	const syncState = useSyncState({ projectId })

	const startSync = useStartSync({ projectId })
	const stopSync = useStopSync({ projectId })

	const connectedPeersCount = syncState
		? getConnectedPeersCount(syncState.remoteDeviceSyncState)
		: 0

	const { data: ownDeviceInfo } = useOwnDeviceInfo()
	const { data: members } = useManyMembers({ projectId, includeLeft: true })

	const selfIsOnlyActiveProjectMember = !members.some(
		(m) =>
			m.deviceId !== ownDeviceInfo.deviceId &&
			(m.role.roleId === CREATOR_ROLE_ID ||
				m.role.roleId === COORDINATOR_ROLE_ID ||
				m.role.roleId === MEMBER_ROLE_ID),
	)

	const displayedExchangeStateContent = selfIsOnlyActiveProjectMember ? (
		<Stack
			direction="column"
			sx={{ alignItems: 'center', flex: 1, gap: 5, padding: 6 }}
		>
			<Typography variant="heroHeader" sx={{ textAlign: 'center' }}>
				{intl.formatMessage(m.noOtherDevicesOnProject)}
			</Typography>

			<ButtonLink
				to="/app/projects/$projectId/team/invite"
				params={{ projectId }}
				variant="text"
			>
				{intl.formatMessage(m.inviteDevices)}
			</ButtonLink>
		</Stack>
	) : (
		<>
			<Suspense>
				<RemoteArchiveIndicator projectId={projectId} />
			</Suspense>

			{syncState ? (
				<DisplayedSyncState projectId={projectId} syncState={syncState} />
			) : (
				<CircularProgress />
			)}
		</>
	)

	const selfIsOnlyProjectMemberEver =
		members.length === 1 && members[0]?.deviceId === ownDeviceInfo.deviceId

	const devicesIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 3,
	})

	return (
		<>
			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Stack
					component="header"
					direction="row"
					sx={{
						alignItems: 'center',
						borderBottom: `1px solid ${BLUE_05}`,
						gap: 4,
						paddingBlock: 4,
						paddingInline: 6,
					}}
				>
					<Typography variant="pageTitle">
						{intl.formatMessage(m.pageTitle)}
					</Typography>

					<NetworkConnectionPill />
				</Stack>

				<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
					<Container maxWidth="sm" sx={{ flex: 1, paddingBlock: 20 }}>
						<Stack direction="column" sx={{ gap: 5 }}>
							<Box sx={{ alignSelf: 'center', position: 'relative' }}>
								<Box
									sx={{
										alignItems: 'center',
										border: `8px solid ${connectedPeersCount > 0 ? ORANGE_00 : BLUE_05}`,
										borderRadius: '50%',
										display: 'flex',
										flexDirection: 'row',
										justifyContent: 'center',
										padding: 6,
									}}
								>
									<Icon
										name="material-symbols-devices"
										htmlColor={connectedPeersCount > 0 ? ORANGE_00 : BLUE_05}
										size={devicesIconSize}
									/>
								</Box>

								{connectedPeersCount > 0 ? (
									<Box
										sx={{
											alignItems: 'center',
											backgroundColor: ORANGE_00,
											borderRadius: '50%',
											bottom: -8,
											display: 'flex',
											flexDirection: 'row',
											justifyContent: 'center',
											position: 'absolute',
											right: -8,
											padding: 2,
											boxShadow: `0px 2px 20px 0px ${alpha(BLACK_00, 0.4)}`,
										}}
									>
										<Icon
											name="material-symbols-stars-2"
											htmlColor={WHITE_00}
											size={`calc(${devicesIconSize} / 2)`}
										/>
									</Box>
								) : null}
							</Box>

							{displayedExchangeStateContent}
						</Stack>
					</Container>

					{
						// NOTE: We do not want to show the exchange button if we are the only member that the project has ever had (e.g. we freshly created a project).
						// Once some other device has joined the project, then we should always show the button, regardless of who's active or not.
						selfIsOnlyProjectMemberEver ? null : (
							<Box
								sx={{
									alignItems: 'center',
									display: 'flex',
									flexDirection: 'row',
									justifyContent: 'center',
									padding: 6,
								}}
							>
								<Button
									fullWidth
									variant={
										syncState?.data.isSyncEnabled ? 'outlined' : 'contained'
									}
									startIcon={
										<Icon
											name={
												syncState?.data.isSyncEnabled
													? 'material-square-filled'
													: 'material-bolt-sharp'
											}
										/>
									}
									onClick={() => {
										if (
											stopSync.status === 'pending' ||
											startSync.status === 'pending'
										) {
											return
										}

										if (syncState?.data.isSyncEnabled) {
											stopSync.mutate(undefined, {
												onError: (err) => {
													captureException(err)
												},
											})
										} else {
											startSync.mutate(undefined, {
												onError: (err) => {
													captureException(err)
												},
											})
										}
									}}
								>
									{intl.formatMessage(
										syncState?.data.isSyncEnabled ? m.stop : m.start,
									)}
								</Button>
							</Box>
						)
					}
				</Stack>
			</Stack>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					startSync.status === 'error'
						? {
								errorMessage: startSync.error.toString(),
								onClose: () => {
									startSync.reset()
								},
							}
						: stopSync.status === 'error'
							? {
									open: true,
									errorMessage: stopSync.error.toString(),
									onClose: () => {
										stopSync.reset()
									},
								}
							: null
				}
			>
				{({ errorMessage, onClose }) => (
					<ErrorDialogContent errorMessage={errorMessage} onClose={onClose} />
				)}
			</DecentDialog>
		</>
	)
}

function RemoteArchiveIndicator({ projectId }: { projectId: string }) {
	const intl = useIntl()

	const { data: members } = useManyMembers({ projectId, includeLeft: false })

	const activeRemoteArchives = members.filter((m) => memberIsRemoteArchive(m))

	const { online } = useBrowserNetInfo()

	const iconSize = useIconSizeBasedOnTypography({
		variant: 'detailCopy',
		multiplier: 0.6,
	})

	if (activeRemoteArchives.length === 0 || !online) {
		return null
	}

	return (
		<Stack
			direction="row"
			sx={{ alignItems: 'center', gap: 2, justifyContent: 'center' }}
		>
			<Icon name="material-circle-filled" size={iconSize} />

			<Typography variant="detailCopy">
				{intl.formatMessage(m.remoteArchiveConnected)}
			</Typography>
		</Stack>
	)
}

function DisplayedSyncState({
	projectId,
	syncState,
}: {
	projectId: string
	syncState: SyncState
}) {
	const intl = useIntl()

	const connectedPeersCount = getConnectedPeersCount(
		syncState.remoteDeviceSyncState,
	)

	const syncingPeersCount = getSyncingPeersCount(
		syncState.remoteDeviceSyncState,
	)

	const progress = useDataSyncProgress({ projectId })

	const syncStage = deriveSyncStage({
		progress,
		connectedPeersCount,
		syncingPeersCount,
		dataSyncEnabled: syncState.data.isSyncEnabled,
	})

	const title = getExchangeStateTitle(syncStage, syncState.data.isSyncEnabled)

	return (
		<Stack direction="column" sx={{ flex: 1, gap: 5, padding: 6 }}>
			<Typography variant="heroHeader" sx={{ textAlign: 'center' }}>
				{intl.formatMessage(title)}
			</Typography>

			{syncStage.name === 'idle' ? null : <SyncProgress stage={syncStage} />}
		</Stack>
	)
}

function getExchangeStateTitle(syncStage: SyncStage, syncEnabled: boolean) {
	const { name } = syncStage

	switch (name) {
		case 'idle': {
			return syncStage.connectedPeersCount > 0
				? m.devicesFound
				: m.lookingForDevices
		}
		case 'waiting': {
			return m.waitingForDevices
		}
		case 'syncing': {
			return syncStage.progress > 0 ? m.exchanging : m.waitingForDevices
		}
		case 'complete-partial': {
			return m.completeAndWaiting
		}
		case 'complete-full': {
			return syncEnabled ? m.complete : m.upToDate
		}
		default: {
			throw new ExhaustivenessError(name)
		}
	}
}

function SyncProgress({
	stage,
}: {
	stage: Extract<
		SyncStage,
		{ name: 'syncing' | 'waiting' | 'complete-partial' | 'complete-full' }
	>
}) {
	const { formatNumber } = useIntl()

	const progressProps: LinearProgressProps =
		stage.name === 'waiting'
			? { variant: 'indeterminate', color: 'primary' }
			: {
					variant: 'determinate',
					value: stage.progress * 100,
					color: stage.name === 'complete-full' ? 'success' : 'primary',
				}

	return (
		<Stack direction="column" sx={{ gap: 3, padding: 6 }}>
			{stage.name === 'complete-full' ? (
				<Icon name="material-check" color="success" />
			) : stage.name !== 'waiting' ? (
				<Icon name="material-bolt-sharp" color="primary" />
			) : null}

			<LinearProgress {...progressProps} />

			<Typography sx={{ textAlign: 'end' }}>
				{formatNumber(stage.name === 'waiting' ? 0 : stage.progress, {
					style: 'percent',
				})}
			</Typography>
		</Stack>
	)
}

function NetworkConnectionPill() {
	const intl = useIntl()

	const wifiConnectionQuery = useQuery({
		...getWifiConnectionsOptions(),
		select: (connections) => {
			return connections[0]
		},
		refetchOnWindowFocus: false,
	})

	const browserNetInfo = useBrowserNetInfo()

	let displayedText: string

	if (
		wifiConnectionQuery.status === 'pending' ||
		wifiConnectionQuery.isRefetching
	) {
		displayedText = intl.formatMessage(m.gettingWifiInfo)
	} else if (
		wifiConnectionQuery.data &&
		// NOTE: Issue with systeminformation module on macOS >=15.6 (https://github.com/digidem/comapeo-desktop/issues/378)
		wifiConnectionQuery.data.ssid !== '&lt;redacted&gt;' &&
		wifiConnectionQuery.data.ssid !== '<redacted>'
	) {
		displayedText = `${wifiConnectionQuery.data.ssid}${
			browserNetInfo.effectiveType
				? // TODO: Should the effectiveType be translatable?
					` - ${browserNetInfo.effectiveType}`
				: undefined
		}`
	} else {
		displayedText = intl.formatMessage(m.wifiInfoUnavailable)
	}

	return (
		<Box sx={{ background: BLUE_06, borderRadius: 2, padding: 1 }}>
			<Typography
				color="textTertiary"
				data-testid="exchange-network-connection-info"
				sx={{ whiteSpace: 'nowrap' }}
				variant="detailCopy"
			>
				{displayedText}
			</Typography>
		</Box>
	)
}

const m = defineMessages({
	pageTitle: {
		id: '$1.routes.app.projects.$projectId.exchange.index.pageTitle',
		defaultMessage: 'Exchange',
		description: 'Title of exchange page.',
	},
	gettingWifiInfo: {
		id: '$1.routes.app.projects.$projectId.exchange.index.gettingWifiInfo',
		defaultMessage: 'Getting Wi-Fi information…',
		description: 'Text displayed when waiting for Wi-Fi information.',
	},
	waitingForDevices: {
		id: '$1.routes.app.projects.$projectId.exchange.index.waitingForDevices',
		defaultMessage: 'Waiting for Devices',
		description: 'Text displayed when waiting for other devices to be found.',
	},
	wifiInfoUnavailable: {
		id: '$1.routes.app.projects.$projectId.exchange.index.wifiInfoUnavailable',
		defaultMessage: 'Wi-Fi info unavailable',
		description: 'Text displayed when Wi-Fi info is unavailable.',
	},
	lookingForDevices: {
		id: '$1.routes.app.projects.$projectId.exchange.index.lookingForDevices',
		defaultMessage: 'Looking for devices…',
		description: 'Text displayed when no other devices have been found.',
	},
	devicesFound: {
		id: '$1.routes.app.projects.$projectId.exchange.index.devicesFound',
		defaultMessage: 'Devices Found',
		description: 'Text displayed when other devices have been found.',
	},
	exchanging: {
		id: '$1.routes.app.projects.$projectId.exchange.index.exchanging',
		defaultMessage: 'Exchanging…',
		description: 'Text displayed when exchanging with other devices.',
	},
	completeAndWaiting: {
		id: '$1.routes.app.projects.$projectId.exchange.index.completeAndWaiting',
		defaultMessage: 'Complete! Waiting for other devices to join.',
		description:
			'Text displayed when exchange is completed with currently connected devices.',
	},
	complete: {
		id: '$1.routes.app.projects.$projectId.exchange.index.complete',
		defaultMessage: 'Complete!',
		description: 'Text displayed when exchange is completed with all devices.',
	},
	upToDate: {
		id: '$1.routes.app.projects.$projectId.exchange.index.upToDate',
		defaultMessage: 'Up to date!',
		description: 'Text displayed when exchangable data is up to date.',
	},
	start: {
		id: '$1.routes.app.projects.$projectId.exchange.index.start',
		defaultMessage: 'Start',
		description: 'Button text to start exchange.',
	},
	stop: {
		id: '$1.routes.app.projects.$projectId.exchange.index.stop',
		defaultMessage: 'Stop',
		description: 'Button text to stop exchange.',
	},
	remoteArchiveConnected: {
		id: '$1.routes.app.projects.$projectId.exchange.index.remoteArchiveConnected',
		defaultMessage: 'Remote Archive connected',
		description: 'Text indicating that some remote archive is connected.',
	},
	noOtherDevicesOnProject: {
		id: '$1.routes.app.projects.$projectId.exchange.index.noOtherDevicesOnProject',
		defaultMessage: 'No other devices are on this project.',
		description: 'Text indicating no other active devices are on the project.',
	},
	inviteDevices: {
		id: '$1.routes.app.projects.$projectId.exchange.index.inviteDevices',
		defaultMessage: 'Invite Devices',
		description: 'Text for link to invite devices page.',
	},
})
