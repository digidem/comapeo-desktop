import { Suspense, useDeferredValue, useEffect, useState } from 'react'
import {
	useRequestCancelInvite,
	useSendInvite,
	useSingleMember,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation } from '@tanstack/react-query'
import { Navigate, createFileRoute, useRouter } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageTag,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import * as v from 'valibot'

import { DisconnectedIndicator } from '../-shared/disconnected-indicator.tsx'
import { DeviceIcon } from '../../../../../-shared/device-icon.tsx'
import {
	BLACK_03,
	BLUE_05,
	WHITE_00,
} from '../../../../../../../../../../shared/colors.ts'
import { DecentDialog } from '../../../../../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../../../../../components/error-dialog.tsx'
import { GenericRoutePendingComponent } from '../../../../../../../../components/generic-route-pending-component.tsx'
import { Icon } from '../../../../../../../../components/icon.tsx'
import {
	Bold,
	Break,
} from '../../../../../../../../components/intl-rich-text.tsx'
import { ButtonLink } from '../../../../../../../../components/link.tsx'
import {
	PanelBody,
	PanelHeader,
	PanelLayout,
} from '../../../../../../../../components/panel-layout.tsx'
import { useLocalPeersState } from '../../../../../../../../contexts/local-peers-store-context.ts'
import { useIconSizeBasedOnTypography } from '../../../../../../../../hooks/icon.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	MEMBER_ROLE_ID,
} from '../../../../../../../../lib/comapeo.ts'
import { createGlobalMutationsKey } from '../../../../../../../../lib/queries/global-mutations.ts'
import { getFormattedDuration } from '../../../../../../../../lib/time.ts'

const ReviewInvitationSearchSchema = v.object({
	role: v.union([v.literal('participant'), v.literal('coordinator')]),
})

export const Route = createFileRoute(
	'/app/projects/$projectId/team/invite/devices/$deviceId/send',
)({
	validateSearch: ReviewInvitationSearchSchema,
	component: RouteComponent,
	onLeave: (match) => {
		const { queryClient, projectApi } = match.context
		const { deviceId } = match.params

		projectApi.$member
			.requestCancelInvite(deviceId)
			.then(() => {
				queryClient.invalidateQueries({
					queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'invites'],
				})
			})
			.catch(() => {
				// intentional no-op
			})
	},
})

const SEND_INVITE_GLOBAL_MUTATIONS_KEY = createGlobalMutationsKey([
	'invite',
	'send',
])

function RouteComponent() {
	const { projectId, deviceId } = Route.useParams()

	const { role } = Route.useSearch()

	const _sendInvite = useSendInvite({ projectId })
	const sendInvite = useMutation({
		mutationKey: SEND_INVITE_GLOBAL_MUTATIONS_KEY,
		mutationFn: async (
			variables: Parameters<(typeof _sendInvite)['mutateAsync']>[0],
		) => {
			return _sendInvite.mutateAsync(variables)
		},
	})

	const cancelInvite = useRequestCancelInvite({ projectId })

	useEffect(
		function cancelInviteOnBrowserRefresh() {
			function onBrowserUnload() {
				cancelInvite.mutate(
					{ deviceId },
					{
						onSuccess: (_data, _variables, _mutateResult, context) => {
							context.client.invalidateQueries({
								queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'invites'],
							})
						},
					},
				)
			}

			window.addEventListener('beforeunload', onBrowserUnload)

			return () => {
				window.removeEventListener('beforeunload', onBrowserUnload)
			}
		},
		[deviceId, cancelInvite],
	)

	const deferredInviteStatus = useDeferredValue(sendInvite.status)

	if (deferredInviteStatus === 'idle' || deferredInviteStatus === 'error') {
		return (
			<>
				<ReviewInvitation
					onSendInvite={() => {
						sendInvite.mutate({
							deviceId,
							roleId:
								role === 'coordinator' ? COORDINATOR_ROLE_ID : MEMBER_ROLE_ID,
						})
					}}
				/>

				<DecentDialog
					fullWidth
					maxWidth="sm"
					value={sendInvite.status === 'error' ? sendInvite.error : null}
				>
					{(error) => (
						<ErrorDialogContent
							errorMessage={error.toString()}
							onClose={() => {
								sendInvite.reset()
							}}
						/>
					)}
				</DecentDialog>
			</>
		)
	}

	if (deferredInviteStatus === 'pending') {
		return (
			<InvitePending
				sentAt={sendInvite.submittedAt}
				onCancelInvite={() => {
					cancelInvite.mutate(
						{ deviceId },
						{
							onSettled: () => {
								sendInvite.reset()
							},
						},
					)
				}}
			/>
		)
	}

	switch (sendInvite.data) {
		case 'REJECT': {
			return (
				<InviteDeclined
					deviceId={sendInvite.variables.deviceId}
					projectId={projectId}
				/>
			)
		}

		case 'ACCEPT': {
			return (
				<Suspense fallback={<GenericRoutePendingComponent />}>
					<InviteAccepted
						deviceId={sendInvite.variables.deviceId}
						projectId={projectId}
					/>
				</Suspense>
			)
		}
		case 'ALREADY': {
			// TODO: Should handle this more intentionally
			return (
				<Navigate
					to="/app/projects/$projectId/team/invite/devices"
					params={{ projectId }}
					replace
				/>
			)
		}
	}
}

function ReviewInvitation({ onSendInvite }: { onSendInvite: () => void }) {
	const intl = useIntl()

	const router = useRouter()

	const { peerOnLoad } = Route.useRouteContext()

	const { projectId, deviceId } = Route.useParams()

	const { role } = Route.useSearch()

	const updatedPeer = useLocalPeersState((peers) => {
		return peers.find((p) => p.deviceId === deviceId)
	})

	const peer = updatedPeer || peerOnLoad

	const backIconSize = useIconSizeBasedOnTypography({
		variant: 'pageTitle',
		multiplier: 1.5,
	})

	const deviceIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 2,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				component="header"
				direction="row"
				sx={{
					alignItems: 'center',
					borderBottom: `1px solid ${BLUE_05}`,
					gap: 2,
					padding: 4,
				}}
			>
				<IconButton
					onClick={() => {
						router.navigate({
							to: '/app/projects/$projectId/team/invite/devices/$deviceId/role',
							params: { projectId, deviceId },
							replace: true,
						})
					}}
					sx={{ color: (theme) => theme.palette.text.secondary }}
				>
					<Icon name="material-arrow-back" size={backIconSize} />
				</IconButton>

				<Typography variant="pageTitle">
					{intl.formatMessage(m.inviteReviewNavTitle)}
				</Typography>
			</Stack>

			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<PanelLayout>
					<PanelHeader
						icon={
							<Stack direction="column" sx={{ gap: 2 }}>
								<Box
									sx={{
										background: BLACK_03,
										borderRadius: '50%',
										display: 'grid',
										padding: 6,
										placeItems: 'center',
									}}
								>
									<DeviceIcon
										deviceType={peer.deviceType}
										size={deviceIconSize}
									/>
								</Box>

								{peer.status === 'disconnected' ? (
									<DisconnectedIndicator />
								) : null}
							</Stack>
						}
						title={peer.name || peer.deviceId}
					/>

					<PanelBody>
						<Typography sx={{ textAlign: 'center' }}>
							{intl.formatMessage(m.deviceBeingInvited, {
								b: Bold,
								br: Break,
								role: intl.formatMessage(
									role === 'coordinator' ? m.coordinator : m.participant,
								),
							})}
						</Typography>
					</PanelBody>
				</PanelLayout>

				<Stack
					direction="row"
					sx={{
						borderTop: `1px solid ${BLUE_05}`,
						justifyContent: 'center',
						padding: 6,
					}}
				>
					<Button
						fullWidth
						variant="contained"
						startIcon={<Icon name="material-send-filled" />}
						onClick={() => {
							onSendInvite()
						}}
					>
						{intl.formatMessage(m.sendInvite)}
					</Button>
				</Stack>
			</Stack>
		</Stack>
	)
}

function InvitePending({
	onCancelInvite,
	sentAt,
}: {
	sentAt: number
	onCancelInvite: () => void
}) {
	const intl = useIntl()

	const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now())

	useEffect(() => {
		const intervalId = setInterval(() => {
			setCurrentTimestamp(Date.now())
		}, 1_000)

		return () => {
			clearInterval(intervalId)
		}
	}, [setCurrentTimestamp])

	const sendIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 8,
	})

	const closeIconSize = useIconSizeBasedOnTypography({
		variant: 'pageTitle',
		multiplier: 1.5,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				component="header"
				direction="row"
				sx={{
					alignItems: 'center',
					borderBottom: `1px solid ${BLUE_05}`,
					gap: 2,
					padding: 4,
				}}
			>
				<IconButton
					onClick={() => {
						onCancelInvite()
					}}
					sx={{ color: (theme) => theme.palette.text.secondary }}
				>
					<Icon name="material-close" size={closeIconSize} />
				</IconButton>

				<Typography variant="pageTitle">
					{intl.formatMessage(m.invitePendingNavTitle)}
				</Typography>
			</Stack>

			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<PanelLayout>
					<PanelHeader
						icon={
							<Icon
								name="comapeo-send"
								color="primary"
								size={sendIconSize}
								sx={{ margin: -10 }}
							/>
						}
						title={intl.formatMessage(m.waiting)}
					/>

					<PanelBody>
						<Typography sx={{ textAlign: 'center' }}>
							{intl.formatMessage(m.timeSinceSent, {
								time: getFormattedDuration(
									Math.round((currentTimestamp - sentAt) / 1000),
								),
							})}
						</Typography>

						<Button
							onClick={() => {
								onCancelInvite()
							}}
							variant="text"
						>
							{intl.formatMessage(m.cancelInvite)}
						</Button>
					</PanelBody>
				</PanelLayout>
			</Stack>
		</Stack>
	)
}

function InviteDeclined({
	deviceId,
	projectId,
}: {
	deviceId: string
	projectId: string
}) {
	const intl = useIntl()

	const router = useRouter()

	const { peerOnLoad } = Route.useRouteContext()

	const updatedPeer = useLocalPeersState((peers) => {
		return peers.find((p) => p.deviceId === deviceId)
	})

	const peer = updatedPeer || peerOnLoad

	const errorIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	const closeIconSize = useIconSizeBasedOnTypography({
		variant: 'pageTitle',
		multiplier: 1.5,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				component="header"
				direction="row"
				sx={{
					alignItems: 'center',
					borderBottom: `1px solid ${BLUE_05}`,
					gap: 2,
					padding: 4,
				}}
			>
				<IconButton
					onClick={() => {
						router.navigate({
							to: '/app/projects/$projectId/team/invite',
							params: { projectId },
							replace: true,
						})
					}}
					sx={{ color: (theme) => theme.palette.text.secondary }}
				>
					<Icon name="material-close" size={closeIconSize} />
				</IconButton>

				<Typography variant="pageTitle">
					{intl.formatMessage(m.inviteDeclinedNavTitle)}
				</Typography>
			</Stack>

			<PanelLayout>
				<PanelHeader
					icon={
						<Icon name="material-error" color="error" size={errorIconSize} />
					}
					title={intl.formatMessage(m.inviteDeclinedHeading, {
						br: Break,
						name: peer.name || '',
					})}
					description={intl.formatMessage(m.inviteDeclinedDescription)}
				/>
			</PanelLayout>

			<Stack
				direction="row"
				sx={{
					borderTop: `1px solid ${BLUE_05}`,
					justifyContent: 'center',
					padding: 6,
				}}
			>
				<ButtonLink
					to="/app/projects/$projectId/team/invite"
					params={{ projectId }}
					replace
					fullWidth
					startIcon={<Icon name="material-symbols-cancel" />}
					sx={{ alignSelf: 'center' }}
					variant="outlined"
				>
					{intl.formatMessage(m.close)}
				</ButtonLink>
			</Stack>
		</Stack>
	)
}

function InviteAccepted({
	deviceId,
	projectId,
}: {
	deviceId: string
	projectId: string
}) {
	const intl = useIntl()

	const router = useRouter()

	const { data: member } = useSingleMember({ projectId, deviceId })

	const deviceIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 3,
	})

	const backIconSize = useIconSizeBasedOnTypography({
		variant: 'pageTitle',
		multiplier: 1.5,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				component="header"
				direction="row"
				sx={{
					alignItems: 'center',
					borderBottom: `1px solid ${BLUE_05}`,
					gap: 2,
					padding: 4,
				}}
			>
				<IconButton
					onClick={() => {
						router.navigate({
							to: '/app/projects/$projectId/team/invite',
							params: { projectId },
							replace: true,
						})
					}}
					sx={{ color: (theme) => theme.palette.text.secondary }}
				>
					<Icon name="material-arrow-back" size={backIconSize} />
				</IconButton>

				<Typography variant="pageTitle">
					{intl.formatMessage(m.inviteAcceptedNavTitle)}
				</Typography>
			</Stack>

			<PanelLayout>
				<PanelHeader
					icon={
						<Box
							sx={{
								background: BLACK_03,
								borderRadius: '50%',
								display: 'grid',
								padding: 6,
								placeItems: 'center',
								position: 'relative',
							}}
						>
							<DeviceIcon
								deviceType={member.deviceType}
								size={deviceIconSize}
							/>

							<Box
								sx={{
									background: (theme) => theme.palette.success.main,
									borderRadius: '50%',
									bottom: (theme) => theme.spacing(-1),
									boxShadow: (theme) => theme.shadows[4],
									display: 'grid',
									padding: 2,
									placeItems: 'center',
									position: 'absolute',
									right: (theme) => theme.spacing(-1),
								}}
							>
								<Icon
									name="material-check"
									htmlColor={WHITE_00}
									size={`calc(${deviceIconSize} / 3)`}
								/>
							</Box>
						</Box>
					}
					title={intl.formatMessage(m.inviteAcceptedHeading, {
						br: Break,
						name: member.name,
					})}
				/>

				<PanelBody>
					<Typography
						sx={{
							fontWeight: (theme) => theme.typography.fontWeightMedium,
							textAlign: 'center',
							textWrap: 'balance',
						}}
					>
						{intl.formatMessage(
							member.role.roleId === COORDINATOR_ROLE_ID
								? m.coordinator
								: m.participant,
						)}
					</Typography>

					{member.joinedAt !== undefined ? (
						<Typography sx={{ textAlign: 'center' }}>
							{intl.formatMessage(m.addedOn, {
								value: (
									<time key={member.deviceId} dateTime={member.joinedAt}>
										{intl.formatDate(member.joinedAt, {
											year: 'numeric',
											month: 'long',
											day: '2-digit',
										})}
									</time>
								),
							})}
						</Typography>
					) : null}
				</PanelBody>
			</PanelLayout>

			<Stack
				direction="row"
				sx={{
					borderTop: `1px solid ${BLUE_05}`,
					justifyContent: 'center',
					padding: 6,
				}}
			>
				<ButtonLink
					to="/app/projects/$projectId/team/invite/devices"
					params={{ projectId }}
					replace
					fullWidth
					startIcon={<Icon name="material-symbols-add-circle-outline" />}
					variant="outlined"
				>
					{intl.formatMessage(m.addAnotherDevice)}
				</ButtonLink>
			</Stack>
		</Stack>
	)
}

const m = defineMessages<{
	readonly participant: NoMessageValues
	readonly coordinator: NoMessageValues
	readonly sendInvite: NoMessageValues
	readonly deviceBeingInvited: {
		readonly b: MessageTag
		readonly br: MessageTag
		readonly role: MessageValue
	}
	readonly waiting: NoMessageValues
	readonly timeSinceSent: { readonly time: MessageValue }
	readonly cancelInvite: NoMessageValues
	readonly accepted: NoMessageValues
	readonly addedOn: { readonly value: MessageValue }
	readonly addAnotherDevice: NoMessageValues
	readonly close: NoMessageValues
	readonly inviteReviewNavTitle: NoMessageValues
	readonly invitePendingNavTitle: NoMessageValues
	readonly inviteDeclinedNavTitle: NoMessageValues
	readonly inviteDeclinedHeading: {
		readonly br: MessageTag
		readonly name: MessageValue
	}
	readonly inviteDeclinedDescription: NoMessageValues
	readonly inviteAcceptedNavTitle: NoMessageValues
	readonly inviteAcceptedHeading: {
		readonly br: MessageTag
		readonly name: MessageValue
	}
}>({
	participant: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.participant',
		defaultMessage: 'Participant',
		description: 'Participant role name.',
	},
	coordinator: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.coordinator',
		defaultMessage: 'Coordinator',
		description: 'Coordinator role name.',
	},
	sendInvite: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.sendInvite',
		defaultMessage: 'Send Invite',
		description: 'Button text for sending invite.',
	},
	deviceBeingInvited: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.deviceBeingInvited',
		defaultMessage: 'Inviting as <br></br><br></br><b>{role}</b>',
		description:
			'Text displaying the device and its role that it is being invited as.',
	},
	waiting: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.waiting',
		defaultMessage: 'Waiting for Device to Accept Invite',
		description: 'Text displayed while waiting for invite response.',
	},
	timeSinceSent: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.timeSinceSent',
		defaultMessage: 'Invite sent {time} seconds ago',
		description: 'Text showing time elapsed since invite was sent',
	},
	cancelInvite: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.cancelInvite',
		defaultMessage: 'Cancel Invite',
		description: 'Text for button to cancel invite.',
	},
	accepted: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.accepted',
		defaultMessage: 'Accepted!',
		description: 'Text displayed when invite is accepted.',
	},
	addedOn: {
		id: 'routes.app.projects.$projectId.team.invite.devices.$deviceId.send.addedOn',
		defaultMessage: 'Added on {value}',
		description: 'Text showing when device was added to project.',
	},
	addAnotherDevice: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.addAnotherDevice',
		defaultMessage: 'Add Another Device',
		description: 'Text for button to add another device.',
	},
	close: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.close',
		defaultMessage: 'Close',
		description: 'Text for button to leave invite flow.',
	},
	inviteReviewNavTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.inviteReviewNavTitle',
		defaultMessage: 'Review Invite',
		description: 'Navigation title text when reviewing invite before sending.',
	},
	invitePendingNavTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.invitePendingNavTitle',
		defaultMessage: 'Waiting for Device',
		description: 'Navigation title text when invite is sent and pending.',
	},
	inviteDeclinedNavTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.inviteDeclinedNavTitle',
		defaultMessage: 'Invite Declined',
		description: 'Navigation title text when invite is declined.',
	},
	inviteDeclinedHeading: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.inviteDeclinedHeading',
		defaultMessage: '{name} <br></br>Declined Invite',
		description: 'Heading text when invite is declined.',
	},
	inviteDeclinedDescription: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.inviteDeclinedDescription',
		defaultMessage:
			'This device has declined your invitation. They have not joined the project.',
		description: 'Description of a declined invite.',
	},
	inviteAcceptedNavTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.inviteAcceptedNavTitle',
		defaultMessage: 'Invite Accepted',
		description: 'Navigation title text when invite is accepted.',
	},
	inviteAcceptedHeading: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.inviteAcceptedHeading',
		defaultMessage: '{name} <br></br>Joined Project',
		description: 'Heading text when invite is accepted.',
	},
})
