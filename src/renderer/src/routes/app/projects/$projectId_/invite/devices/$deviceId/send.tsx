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

import { DeviceRow } from '../-shared/device-row'
import { DisconnectedIndicator } from '../-shared/disconnected-indicator'
import { DeviceIcon } from '../../../../-shared/device-icon'
import {
	BLACK,
	BLUE_GREY,
	COMAPEO_BLUE,
	GREEN,
	WHITE,
} from '../../../../../../../colors'
import { ErrorDialog } from '../../../../../../../components/error-dialog'
import { GenericRoutePendingComponent } from '../../../../../../../components/generic-route-pending-component'
import { Icon } from '../../../../../../../components/icon'
import { ButtonLink } from '../../../../../../../components/link'
import { useLocalPeersState } from '../../../../../../../contexts/local-peers-store-context'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	MEMBER_ROLE_ID,
} from '../../../../../../../lib/comapeo'
import { createGlobalMutationsKey } from '../../../../../../../lib/queries/global-mutations'
import { getFormattedDuration } from '../../../../../../../lib/time'

const ReviewInvitationSearchSchema = v.object({
	role: v.union([v.literal('participant'), v.literal('coordinator')]),
})

export const Route = createFileRoute(
	'/app/projects/$projectId_/invite/devices/$deviceId/send',
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

	const sendInvite = useSendInvite({ projectId })

	const invite = useMutation({
		mutationKey: SEND_INVITE_GLOBAL_MUTATIONS_KEY,
		mutationFn: async (
			variables: Parameters<(typeof sendInvite)['mutateAsync']>[0],
		) => {
			return sendInvite.mutateAsync(variables)
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

	const deferredInviteStatus = useDeferredValue(invite.status)

	if (deferredInviteStatus === 'idle' || deferredInviteStatus === 'error') {
		return (
			<ReviewInvitation
				error={invite.error}
				onDismissError={() => {
					invite.reset()
				}}
				onSendInvite={() => {
					invite.mutate({
						deviceId,
						roleId:
							role === 'coordinator' ? COORDINATOR_ROLE_ID : MEMBER_ROLE_ID,
					})
				}}
			/>
		)
	}

	if (deferredInviteStatus === 'pending') {
		return (
			<InvitePending
				sentAt={invite.submittedAt}
				onCancelInvite={() => {
					cancelInvite.mutate(
						{ deviceId },
						{
							onSettled: () => {
								invite.reset()
							},
						},
					)
				}}
			/>
		)
	}

	switch (invite.data) {
		case 'REJECT': {
			return (
				<InviteRejected
					deviceId={invite.variables.deviceId}
					projectId={projectId}
				/>
			)
		}

		case 'ACCEPT': {
			return (
				<Suspense fallback={<GenericRoutePendingComponent />}>
					<InviteAccepted
						deviceId={invite.variables.deviceId}
						projectId={projectId}
					/>
				</Suspense>
			)
		}
		case 'ALREADY': {
			// TODO: Should handle this more intentionally
			return (
				<Navigate
					to="/app/projects/$projectId/invite/devices"
					params={{ projectId }}
					replace
				/>
			)
		}
	}
}

function ReviewInvitation({
	error,
	onDismissError,
	onSendInvite,
}: {
	error: Error | null
	onDismissError: () => void
	onSendInvite: () => void
}) {
	const { formatMessage: t } = useIntl()

	const router = useRouter()

	const { peerOnLoad } = Route.useRouteContext()

	const { projectId, deviceId } = Route.useParams()

	const { role } = Route.useSearch()

	const updatedPeer = useLocalPeersState((peers) => {
		return peers.find((p) => p.deviceId === deviceId)
	})

	const peer = updatedPeer || peerOnLoad

	return (
		<>
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
							router.navigate({
								to: '/app/projects/$projectId/invite/devices/$deviceId/role',
								params: { projectId, deviceId },
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
					overflow="auto"
					justifyContent="space-between"
				>
					<Box padding={6}>
						<Stack
							direction="column"
							padding={6}
							border={`1px solid ${BLUE_GREY}`}
							borderRadius={2}
							justifyContent="center"
							alignItems="center"
							gap={4}
						>
							<DeviceIcon deviceType={peer.deviceType} size="48px" />

							{peer.status === 'disconnected' ? (
								<DisconnectedIndicator />
							) : null}

							<Typography textAlign="center">
								{t(m.deviceBeingInvited, {
									name: (
										<Typography
											variant="inherit"
											component="span"
											fontSize={(theme) => theme.typography.h1.fontSize}
											fontWeight={500}
										>
											{peer.name}
										</Typography>
									),
									role: (
										<Typography
											variant="inherit"
											component="span"
											fontSize={(theme) => theme.typography.h2.fontSize}
											fontWeight={500}
										>
											{role === 'coordinator'
												? t(m.coordinator)
												: t(m.participant)}
										</Typography>
									),
								})}
							</Typography>
						</Stack>
					</Box>

					<Box
						display="flex"
						flexDirection="row"
						justifyContent="center"
						paddingInline={6}
						paddingBlockEnd={6}
						position="sticky"
						bottom={0}
						zIndex={1}
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
							{t(m.sendInvite)}
						</Button>
					</Box>
				</Stack>
			</Stack>

			<ErrorDialog
				open={!!error}
				errorMessage={error?.toString()}
				onClose={onDismissError}
			/>
		</>
	)
}

function InvitePending({
	onCancelInvite,
	sentAt,
}: {
	sentAt: number
	onCancelInvite: () => void
}) {
	const { formatMessage: t } = useIntl()
	const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now())

	useEffect(() => {
		const intervalId = setInterval(() => {
			setCurrentTimestamp(Date.now())
		}, 1_000)

		return () => {
			clearInterval(intervalId)
		}
	}, [setCurrentTimestamp])

	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Stack direction="column" justifyContent="space-between" flex={1} gap={6}>
				<Stack direction="column" gap={3} alignItems="center" padding={6}>
					<Icon name="comapeo-send" htmlColor={COMAPEO_BLUE} size={240} />
					<Container maxWidth="xs">
						<Typography variant="h1" fontWeight={500} textAlign="center">
							{t(m.waiting)}
						</Typography>
					</Container>
				</Stack>

				<Stack direction="column" gap={3} alignItems="center" padding={6}>
					<Typography>
						{t(m.timeSinceSent, {
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
						{t(m.cancelInvite)}
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
	const { formatMessage: t } = useIntl()

	const { peerOnLoad } = Route.useRouteContext()

	const updatedPeer = useLocalPeersState((peers) => {
		return peers.find((p) => p.deviceId === deviceId)
	})

	const peer = updatedPeer || peerOnLoad

	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Stack
				direction="column"
				flex={1}
				overflow="auto"
				justifyContent="space-between"
			>
				<Stack
					direction="column"
					padding={6}
					borderRadius={2}
					justifyContent="center"
					alignItems="center"
					gap={4}
				>
					<Box>
						<Icon name="material-error" color="error" size={128} />
					</Box>

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.invitationDeclinedTitle)}
					</Typography>

					<Container maxWidth="xs">
						<Typography textAlign="center">
							{t(m.invitationDeclinedDescription)}
						</Typography>
					</Container>

					<DeviceRow
						deviceId={peer.deviceId}
						deviceType={peer.deviceType}
						name={peer.name}
					/>
				</Stack>

				<Box
					display="flex"
					flexDirection="row"
					justifyContent="center"
					paddingInline={6}
					paddingBlockEnd={6}
					position="sticky"
					bottom={0}
					zIndex={1}
				>
					<ButtonLink
						to="/app/projects/$projectId/invite"
						params={{ projectId }}
						replace
						fullWidth
						variant="contained"
						sx={{ maxWidth: 400, alignSelf: 'center' }}
					>
						{t(m.close)}
					</ButtonLink>
				</Box>
			</Stack>
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
	const { formatMessage: t } = useIntl()

	const { data: member } = useSingleMember({ projectId, deviceId })

	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Stack
				direction="column"
				flex={1}
				overflow="auto"
				justifyContent="space-between"
			>
				<Box padding={6}>
					<Stack
						direction="column"
						padding={6}
						border={`1px solid ${BLUE_GREY}`}
						borderRadius={2}
						justifyContent="center"
						alignItems="center"
						gap={4}
					>
						<Box position="relative">
							<DeviceIcon deviceType={member.deviceType} size="60px" />
							<Box
								position="absolute"
								right={-4}
								bottom={-4}
								zIndex={1}
								display="flex"
								flexDirection="column"
								padding={2}
								borderRadius="50%"
								bgcolor={GREEN}
								boxShadow={ICON_BOX_SHADOW}
							>
								<Icon name="material-check" htmlColor={WHITE} size={24} />
							</Box>
						</Box>

						<Typography
							fontSize={(theme) => theme.typography.h1.fontSize}
							fontWeight={500}
							textAlign="center"
						>
							{member.name}
						</Typography>

						<Typography
							fontSize={(theme) => theme.typography.h2.fontSize}
							fontWeight={500}
							textAlign="center"
						>
							{t(m.accepted)}
						</Typography>

						<Typography
							fontSize={(theme) => theme.typography.h2.fontSize}
							textAlign="center"
						>
							{t(
								member.role.roleId === COORDINATOR_ROLE_ID
									? m.coordinator
									: m.participant,
							)}
						</Typography>

						{member.joinedAt !== undefined ? (
							<Typography color="textSecondary">
								{t(m.addedOn, { date: new Date(member.joinedAt) })}
							</Typography>
						) : null}
					</Stack>
				</Box>

				<Box
					display="flex"
					flexDirection="column"
					justifyContent="center"
					paddingInline={6}
					paddingBlockEnd={6}
					gap={4}
					position="sticky"
					bottom={0}
					zIndex={1}
				>
					<ButtonLink
						to="/app/projects/$projectId/invite/devices"
						params={{ projectId }}
						replace
						fullWidth
						variant="outlined"
						sx={{ maxWidth: 400, alignSelf: 'center' }}
					>
						{t(m.addAnotherDevice)}
					</ButtonLink>

					<ButtonLink
						to="/app/projects/$projectId/team"
						params={{ projectId }}
						replace
						fullWidth
						variant="contained"
						sx={{ maxWidth: 400, alignSelf: 'center' }}
					>
						{t(m.close)}
					</ButtonLink>
				</Box>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.navTitle',
		defaultMessage: 'Review Invitation',
		description: 'Title of the review invite page.',
	},
	participant: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.participant',
		defaultMessage: 'Participant',
		description: 'Participant role name.',
	},
	coordinator: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.coordinator',
		defaultMessage: 'Coordinator',
		description: 'Coordinator role name.',
	},
	sendInvite: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.sendInvite',
		defaultMessage: 'Send Invite',
		description: 'Button text for sending invite.',
	},
	deviceBeingInvited: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.deviceBeingInvited',
		defaultMessage:
			'{name}<br></br><br></br> is being invited as <br></br><br></br>{role}',
		description:
			'Text displaying the device and its role that it is being invited as.',
	},
	waiting: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.waiting',
		defaultMessage: 'Waiting for Device to Accept Invite',
		description: 'Text displayed while waiting for invite response.',
	},
	inviteAccepted: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.inviteAccepted',
		defaultMessage: 'Invite Accepted',
		description: 'Text displayed when invite is accepted.',
	},
	timeSinceSent: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.timeSinceSent',
		defaultMessage: 'Invite sent {time}s ago',
		description: 'Text showing time elapsed since invite was sent',
	},
	cancelInvite: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.cancelInvite',
		defaultMessage: 'Cancel Invite',
		description: 'Text for button to cancel invite.',
	},
	accepted: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.accepted',
		defaultMessage: 'Accepted!',
		description: 'Text displayed when invite is accepted.',
	},
	addedOn: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.addedOn',
		defaultMessage: 'Added on {date, date, long}',
		description: 'Text showing when device was added to project.',
	},
	addAnotherDevice: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.addAnotherDevice',
		defaultMessage: 'Add Another Device',
		description: 'Text for button to add another device.',
	},
	close: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.close',
		defaultMessage: 'Close',
		description: 'Text for button to leave invite flow.',
	},
	invitationDeclinedTitle: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.invitationDeclinedTitle',
		defaultMessage: 'Invitation Declined',
		description: 'Title of page when invite is declined.',
	},
	invitationDeclinedDescription: {
		id: 'routes.app.projects.$projectId_.invite.devices.$deviceId.send.invitationDeclinedDescription',
		defaultMessage:
			'This device has declined your invitation. They have not joined the project.',
		description: 'Description of a declined invite.',
	},
})
