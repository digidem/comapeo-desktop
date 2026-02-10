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
import LinearProgress, {
	type LinearProgressProps,
} from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { NetworkConnectionInfo } from '../../-shared/network-connection-info'
import { TwoPanelLayout } from '../../../-components/two-panel-layout'
import {
	BLUE_GREY,
	COMAPEO_BLUE,
	DARKER_ORANGE,
	GREEN,
	LIGHT_GREY,
} from '../../../../../colors'
import { ErrorDialog } from '../../../../../components/error-dialog'
import { GenericRoutePendingComponent } from '../../../../../components/generic-route-pending-component'
import { Icon } from '../../../../../components/icon'
import { ButtonLink } from '../../../../../components/link.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon'
import { useBrowserNetInfo } from '../../../../../hooks/network'
import {
	BLOCKED_ROLE_ID,
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	LEFT_ROLE_ID,
	MEMBER_ROLE_ID,
	memberIsRemoteArchive,
} from '../../../../../lib/comapeo'
import { ExhaustivenessError } from '../../../../../lib/exchaustiveness-error'
import {
	deriveSyncStage,
	getConnectedPeersCount,
	getSyncingPeersCount,
	type SyncStage,
} from '../../../../../lib/sync'

export const Route = createFileRoute('/app/projects/$projectId_/exchange/')({
	beforeLoad: async ({ context, params }) => {
		const { clientApi, queryClient } = context
		const { projectId } = params

		let projectApi
		try {
			projectApi = await queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects', projectId],
				queryFn: async () => {
					return clientApi.getProject(projectId)
				},
			})
		} catch {
			throw notFound()
		}

		return { projectApi }
	},
	loader: async ({ context, params }) => {
		const { queryClient, projectApi } = context
		const { projectId } = params

		await Promise.all([
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
	pendingComponent: () => {
		return (
			<TwoPanelLayout
				start={<GenericRoutePendingComponent />}
				end={<Box bgcolor={LIGHT_GREY} display="flex" flex={1} />}
			/>
		)
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const { projectId } = Route.useParams()

	const syncState = useSyncState({ projectId })

	const startSync = useStartSync({ projectId })
	const stopSync = useStopSync({ projectId })

	const errorDialogProps =
		startSync.status === 'error'
			? {
					open: true,
					errorMessage: startSync.error.message,
					onClose: () => {
						startSync.reset()
					},
				}
			: stopSync.status === 'error'
				? {
						open: true,
						errorMessage: stopSync.error.message,
						onClose: () => {
							stopSync.reset()
						},
					}
				: { open: false, onClose: () => {} }

	const connectedPeersCount = syncState
		? getConnectedPeersCount(syncState.remoteDeviceSyncState)
		: 0

	const { data: ownDeviceInfo } = useOwnDeviceInfo()
	const { data: members } = useManyMembers({ projectId })

	const selfIsOnlyActiveProjectMember = !members.some(
		(m) =>
			m.deviceId !== ownDeviceInfo.deviceId &&
			(m.role.roleId === CREATOR_ROLE_ID ||
				m.role.roleId === COORDINATOR_ROLE_ID ||
				m.role.roleId === MEMBER_ROLE_ID),
	)

	const displayedExchangeStateContent = selfIsOnlyActiveProjectMember ? (
		<Stack direction="column" flex={1} gap={5} padding={6} alignItems="center">
			<Typography
				component="p"
				variant="h1"
				fontWeight={500}
				textAlign="center"
			>
				{t(m.noOtherDevicesOnProject)}
			</Typography>

			<ButtonLink
				variant="text"
				to="/app/projects/$projectId/invite"
				params={{ projectId }}
			>
				{t(m.inviteDevices)}
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

	return (
		<>
			<TwoPanelLayout
				start={
					<Stack
						direction="column"
						flex={1}
						overflow="auto"
						justifyContent="space-between"
						padding={6}
						gap={6}
					>
						<Box flexDirection="row" alignItems="center">
							<Box
								display="flex"
								flex={1}
								flexDirection="row"
								justifyContent="center"
								alignItems="center"
								borderRadius={2}
								border={`1px solid ${BLUE_GREY}`}
								padding={4}
								overflow="auto"
								data-testid="exchange-network-connection-info"
							>
								<Suspense
									fallback={
										<Typography fontWeight={500}>
											{t(m.gettingWifiInfo)}
										</Typography>
									}
								>
									<NetworkConnectionInfo waitingText={t(m.gettingWifiInfo)} />
								</Suspense>
							</Box>
						</Box>

						<Stack direction="column" gap={5} flex={1} paddingBlock={10}>
							<Box
								display="flex"
								flexDirection="row"
								alignItems="center"
								justifyContent="center"
								flex={0}
								position="relative"
							>
								<Box
									display="flex"
									flexDirection="column"
									padding={2}
									borderRadius="50%"
									border={`12px solid ${connectedPeersCount > 0 ? DARKER_ORANGE : BLUE_GREY}`}
								>
									<Icon
										name="material-bolt-sharp"
										htmlColor={
											connectedPeersCount > 0 ? DARKER_ORANGE : BLUE_GREY
										}
										size={128}
									/>
								</Box>
							</Box>

							{displayedExchangeStateContent}
						</Stack>

						{
							// NOTE: We do not want to show the exchange button if we are the only member that the project has ever had (e.g. we freshly created a project).
							// Once some other device has joined the project, then we should always show the button, regardless of who's active or not.
							selfIsOnlyProjectMemberEver ? null : (
								<Box
									display="flex"
									flexDirection="row"
									alignItems="center"
									justifyContent="center"
								>
									<Button
										fullWidth
										variant={
											syncState?.data.isSyncEnabled ? 'outlined' : 'contained'
										}
										sx={{ maxWidth: 400 }}
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
										{t(syncState?.data.isSyncEnabled ? m.stop : m.start)}
									</Button>
								</Box>
							)
						}
					</Stack>
				}
				end={<Box bgcolor={LIGHT_GREY} display="flex" flex={1} />}
			/>

			<ErrorDialog {...errorDialogProps} />
		</>
	)
}

function RemoteArchiveIndicator({ projectId }: { projectId: string }) {
	const { formatMessage: t } = useIntl()
	const { data: members } = useManyMembers({ projectId })

	const activeRemoteArchives = members.filter(
		(m) =>
			memberIsRemoteArchive(m) &&
			m.role.roleId !== LEFT_ROLE_ID &&
			m.role.roleId !== BLOCKED_ROLE_ID,
	)

	const { online } = useBrowserNetInfo()

	const iconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body2',
		multiplier: 0.6,
	})

	if (activeRemoteArchives.length === 0 || !online) {
		return null
	}

	return (
		<Stack direction="row" justifyContent="center" alignItems="center" gap={2}>
			<Icon name="material-circle-filled" size={iconSize} />
			<Typography variant="body2">{t(m.remoteArchiveConnected)}</Typography>
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
	const { formatMessage: t } = useIntl()

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
		<Stack direction="column" flex={1} gap={5} padding={6}>
			<Typography
				component="p"
				variant="h1"
				fontWeight={500}
				textAlign="center"
			>
				{t(title)}
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
			? {
					variant: 'indeterminate',
					color: 'primary',
				}
			: {
					variant: 'determinate',
					value: stage.progress * 100,
					color: stage.name === 'complete-full' ? 'success' : 'primary',
				}

	return (
		<Stack direction="column" gap={3} padding={6}>
			{stage.name === 'complete-full' ? (
				<Icon name="material-check" htmlColor={GREEN} />
			) : stage.name !== 'waiting' ? (
				<Icon name="material-bolt-sharp" htmlColor={COMAPEO_BLUE} />
			) : null}

			<LinearProgress {...progressProps} />

			<Typography color="textSecondary" textAlign="end">
				{formatNumber(stage.name === 'waiting' ? 0 : stage.progress, {
					style: 'percent',
				})}
			</Typography>
		</Stack>
	)
}

const m = defineMessages({
	gettingWifiInfo: {
		id: 'routes.app.projects.$projectId_.exchange.index.gettingWifiInfo',
		defaultMessage: 'Getting Wi-Fi information…',
		description: 'Text displayed when waiting for Wi-Fi information.',
	},
	waitingForDevices: {
		id: 'routes.app.projects.$projectId_.exchange.index.waitingForDevices',
		defaultMessage: 'Waiting for Devices',
		description: 'Text displayed when waiting for other devices to be found.',
	},
	lookingForDevices: {
		id: 'routes.app.projects.$projectId_.exchange.index.lookingForDevices',
		defaultMessage: 'Looking for devices…',
		description: 'Text displayed when no other devices have been found.',
	},
	devicesFound: {
		id: 'routes.app.projects.$projectId_.exchange.index.devicesFound',
		defaultMessage: 'Devices found.',
		description: 'Text displayed when other devices have been found.',
	},
	exchanging: {
		id: 'routes.app.projects.$projectId_.exchange.index.exchanging',
		defaultMessage: 'Exchanging…',
		description: 'Text displayed when exchanging with other devices.',
	},
	completeAndWaiting: {
		id: 'routes.app.projects.$projectId_.exchange.index.completeAndWaiting',
		defaultMessage: 'Complete! Waiting for other devices to join.',
		description:
			'Text displayed when exchange is completed with currently connected devices.',
	},
	complete: {
		id: 'routes.app.projects.$projectId_.exchange.index.complete',
		defaultMessage: 'Complete!',
		description: 'Text displayed when exchange is completed with all devices.',
	},
	upToDate: {
		id: 'routes.app.projects.$projectId_.exchange.index.upToDate',
		defaultMessage: 'Up to date!',
		description: 'Text displayed when exchangable data is up to date.',
	},
	start: {
		id: 'routes.app.projects.$projectId_.exchange.index.start',
		defaultMessage: 'Start',
		description: 'Button text to start exchange.',
	},
	stop: {
		id: 'routes.app.projects.$projectId_.exchange.index.stop',
		defaultMessage: 'Stop',
		description: 'Button text to stop exchange.',
	},
	remoteArchiveConnected: {
		id: 'routes.app.projects.$projectId_.exchange.index.remoteArchiveConnected',
		defaultMessage: 'Remote Archive connected',
		description: 'Text indicating that some remote archive is connected.',
	},
	noOtherDevicesOnProject: {
		id: 'routes.app.projects.$projectId_.exchange.index.noOtherDevicesOnProject',
		defaultMessage: 'No other devices are on this project.',
		description: 'Text indicating no other active devices are on the project.',
	},
	inviteDevices: {
		id: 'routes.app.projects.$projectId_.exchange.index.inviteDevices',
		defaultMessage: 'Invite Devices',
		description: 'Text for link to invite devices page.',
	},
})
