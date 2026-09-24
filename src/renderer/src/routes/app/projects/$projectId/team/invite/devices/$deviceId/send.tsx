import { Suspense, useDeferredValue, useEffect, useState } from 'react'
import {
	useRequestCancelInvite,
	useSendInvite,
	useSingleMember,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { useMutation } from '@tanstack/react-query'
import { Navigate, createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { DeviceRow } from '../-shared/device-row.tsx'
import { DisconnectedIndicator } from '../-shared/disconnected-indicator.tsx'
import { DeviceIcon } from '../../../../../-shared/device-icon.tsx'
import {
	BLACK,
	BLUE_GREY,
	COMAPEO_BLUE,
	GREEN,
	WHITE,
} from '../../../../../../../../colors.ts'
import { DecentDialog } from '../../../../../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../../../../../components/error-dialog.tsx'
import { GenericRoutePendingComponent } from '../../../../../../../../components/generic-route-pending-component.tsx'
import { Icon } from '../../../../../../../../components/icon.tsx'
import { ButtonLink } from '../../../../../../../../components/link.tsx'
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
				<InviteRejected
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
		typographyVariant: 'h1',
		multiplier: 1.25,
	})

	const deviceIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 2,
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
					onClick={() => {
						router.navigate({
							to: '/app/projects/$projectId/team/invite/devices/$deviceId/role',
							params: { projectId, deviceId },
							replace: true,
						})
					}}
				>
					<Icon
						name="material-arrow-back"
						size={backIconSize}
						htmlColor={BLACK}
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
					<Stack
						direction="column"
						sx={{ flex: 1, gap: 6, justifyContent: 'space-between' }}
					>
						<Box sx={{ padding: 6 }}>
							<Stack
								direction="column"
								sx={{
									alignItems: 'center',
									border: `1px solid ${BLUE_GREY}`,
									borderRadius: 2,
									gap: 4,
									justifyContent: 'center',
									paddingBlock: 20,
									paddingInline: 6,
								}}
							>
								<DeviceIcon
									deviceType={peer.deviceType}
									size={deviceIconSize}
								/>

								{peer.status === 'disconnected' ? (
									<DisconnectedIndicator />
								) : null}

								<Typography sx={{ textAlign: 'center' }}>
									{intl.formatMessage(m.deviceBeingInvited, {
										name: (
											<Typography
												variant="inherit"
												component="span"
												sx={{
													fontSize: (theme) => theme.typography.h1.fontSize,
													fontWeight: 500,
												}}
											>
												{peer.name}
											</Typography>
										),
										role: (
											<Typography
												variant="inherit"
												component="span"
												sx={{
													fontSize: (theme) => theme.typography.h2.fontSize,
													fontWeight: 500,
												}}
											>
												{role === 'coordinator'
													? intl.formatMessage(m.coordinator)
													: intl.formatMessage(m.participant)}
											</Typography>
										),
									})}
								</Typography>
							</Stack>
						</Box>

						<Box
							sx={{
								display: 'flex',
								flexDirection: 'row',
								justifyContent: 'center',
							}}
						>
							<Button
								fullWidth
								variant="contained"
								startIcon={<Icon name="material-send-filled" />}
								sx={{ maxWidth: 400 }}
								onClick={() => {
									onSendInvite()
								}}
							>
								{intl.formatMessage(m.sendInvite)}
							</Button>
						</Box>
					</Stack>
				</Container>
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
		typographyVariant: 'h1',
		multiplier: 8,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				direction="column"
				sx={{ justifyContent: 'space-between', flex: 1, gap: 6 }}
			>
				<Stack
					direction="column"
					sx={{ alignItems: 'center', gap: 3, padding: 6 }}
				>
					<Icon
						name="comapeo-send"
						htmlColor={COMAPEO_BLUE}
						size={sendIconSize}
					/>

					<Container maxWidth="xs">
						<Typography
							variant="h1"
							sx={{ fontWeight: 500, textAlign: 'center' }}
						>
							{intl.formatMessage(m.waiting)}
						</Typography>
					</Container>
				</Stack>

				<Stack
					direction="column"
					sx={{ alignItems: 'center', gap: 3, padding: 6 }}
				>
					<Typography>
						{intl.formatMessage(m.timeSinceSent, {
							time: getFormattedDuration(
								Math.round((currentTimestamp - sentAt) / 1000),
							),
						})}
					</Typography>

					<Button
						variant="text"
						onClick={() => {
							onCancelInvite()
						}}
					>
						{intl.formatMessage(m.cancelInvite)}
					</Button>
				</Stack>
			</Stack>
		</Stack>
	)
}

function InviteRejected({
	deviceId,
	projectId,
}: {
	deviceId: string
	projectId: string
}) {
	const intl = useIntl()

	const { peerOnLoad } = Route.useRouteContext()

	const updatedPeer = useLocalPeersState((peers) => {
		return peers.find((p) => p.deviceId === deviceId)
	})

	const peer = updatedPeer || peerOnLoad

	const errorIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 4,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Container
				maxWidth="sm"
				sx={{
					display: 'flex',
					flex: 1,
					flexDirection: 'column',
					padding: 6,
				}}
			>
				<Stack
					direction="column"
					sx={{ flex: 1, gap: 10, justifyContent: 'space-between' }}
				>
					<Stack
						direction="column"
						sx={{
							alignItems: 'center',
							borderRadius: 2,
							gap: 4,
							justifyContent: 'center',
						}}
					>
						<Icon name="material-error" color="error" size={errorIconSize} />

						<Typography
							variant="h1"
							sx={{ fontWeight: 500, textAlign: 'center' }}
						>
							{intl.formatMessage(m.invitationDeclinedTitle)}
						</Typography>

						<Typography sx={{ textAlign: 'center' }}>
							{intl.formatMessage(m.invitationDeclinedDescription)}
						</Typography>

						<DeviceRow
							deviceId={peer.deviceId}
							deviceType={peer.deviceType}
							name={peer.name}
						/>
					</Stack>

					<Box
						sx={{
							display: 'flex',
							flexDirection: 'row',
							justifyContent: 'center',
						}}
					>
						<ButtonLink
							to="/app/projects/$projectId/team/invite"
							params={{ projectId }}
							replace
							fullWidth
							variant="contained"
							sx={{ maxWidth: 400, alignSelf: 'center' }}
						>
							{intl.formatMessage(m.close)}
						</ButtonLink>
					</Box>
				</Stack>
			</Container>
		</Stack>
	)
}

const ICON_BOX_SHADOW = `0px 2px 20px 0px ${alpha(BLACK, 0.4)}`

function InviteAccepted({
	deviceId,
	projectId,
}: {
	deviceId: string
	projectId: string
}) {
	const intl = useIntl()

	const { data: member } = useSingleMember({ projectId, deviceId })

	const deviceIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 3,
	})

	const successIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				direction="column"
				sx={{ flex: 1, overflow: 'auto', justifyContent: 'space-between' }}
			>
				<Container
					maxWidth="sm"
					sx={{ display: 'flex', flex: 1, flexDirection: 'column', padding: 6 }}
				>
					<Stack
						direction="column"
						sx={{ flex: 1, gap: 10, justifyContent: 'space-between' }}
					>
						<Stack
							direction="column"
							sx={{
								alignItems: 'center',
								border: `1px solid ${BLUE_GREY}`,
								borderRadius: 2,
								gap: 6,
								justifyContent: 'center',
								paddingBlock: 20,
								paddingInline: 6,
							}}
						>
							<Box sx={{ position: 'relative' }}>
								<DeviceIcon
									deviceType={member.deviceType}
									size={deviceIconSize}
								/>

								<Box
									sx={{
										position: 'absolute',
										right: -4,
										bottom: -4,
										zIndex: 1,
										display: 'flex',
										flexDirection: 'column',
										padding: 2,
										borderRadius: '50%',
										bgcolor: GREEN,
										boxShadow: ICON_BOX_SHADOW,
									}}
								>
									<Icon
										name="material-check"
										htmlColor={WHITE}
										size={successIconSize}
									/>
								</Box>
							</Box>

							<Typography
								component="p"
								variant="h1"
								sx={{ fontWeight: 500, textAlign: 'center' }}
							>
								{member.name}
							</Typography>

							<Typography
								component="p"
								variant="h2"
								sx={{ fontWeight: 500, textAlign: 'center' }}
							>
								{intl.formatMessage(m.accepted)}
							</Typography>

							<Typography
								component="p"
								variant="h2"
								sx={{ textAlign: 'center' }}
							>
								{intl.formatMessage(
									member.role.roleId === COORDINATOR_ROLE_ID
										? m.coordinator
										: m.participant,
								)}
							</Typography>

							{member.joinedAt !== undefined ? (
								<Typography color="textSecondary" sx={{ textAlign: 'center' }}>
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
						</Stack>

						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								gap: 4,
								justifyContent: 'center',
							}}
						>
							<ButtonLink
								to="/app/projects/$projectId/team/invite/devices"
								params={{ projectId }}
								replace
								fullWidth
								variant="outlined"
								sx={{ maxWidth: 400, alignSelf: 'center' }}
							>
								{intl.formatMessage(m.addAnotherDevice)}
							</ButtonLink>

							<ButtonLink
								to="/app/projects/$projectId/team"
								params={{ projectId }}
								replace
								fullWidth
								variant="contained"
								sx={{ maxWidth: 400, alignSelf: 'center' }}
							>
								{intl.formatMessage(m.close)}
							</ButtonLink>
						</Box>
					</Stack>
				</Container>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	navTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.navTitle',
		defaultMessage: 'Review Invitation',
		description: 'Title of the review invite page.',
	},
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
		defaultMessage:
			'{name}<br></br><br></br> is being invited as <br></br><br></br>{role}',
		description:
			'Text displaying the device and its role that it is being invited as.',
	},
	waiting: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.waiting',
		defaultMessage: 'Waiting for Device to Accept Invite',
		description: 'Text displayed while waiting for invite response.',
	},
	inviteAccepted: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.inviteAccepted',
		defaultMessage: 'Invite Accepted',
		description: 'Text displayed when invite is accepted.',
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
	invitationDeclinedTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.invitationDeclinedTitle',
		defaultMessage: 'Invitation Declined',
		description: 'Title of page when invite is declined.',
	},
	invitationDeclinedDescription: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.$deviceId.send.invitationDeclinedDescription',
		defaultMessage:
			'This device has declined your invitation. They have not joined the project.',
		description: 'Description of a declined invite.',
	},
})
