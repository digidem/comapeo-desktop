import type { ReactNode } from 'react'
import type { InviteApi } from '@comapeo/core'
import {
	useAcceptInvite,
	useManyInvites,
	useRejectInvite,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import { useSpinDelay } from 'spin-delay'

import { BLUE_05 } from '../../../../shared/colors.ts'
import { DecentDialog } from '../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../components/error-dialog.tsx'
import { Icon } from '../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../hooks/icon.ts'
import { ExhaustivenessError } from '../../lib/exhaustiveness-error.ts'

type DialogContentProps =
	| {
			status: 'success'
			invite: InviteApi.Invite
			projectId: string
			remainingInvites: Array<InviteApi.Invite>
			onViewProject: (params: {
				projectId: string
				remainingInvites: Array<InviteApi.Invite>
			}) => void
			onCloseAcceptedInvite: () => void
	  }
	| {
			status: 'pending'
			invite: InviteApi.Invite
			onAccept: () => void
			onReject: () => void
			isActionPending: boolean
			isActionVisiblyPending: boolean
	  }
	| {
			status: 'error'
			error: Error
			onClose: () => void
	  }

export function ProjectInviteDialog() {
	const { data: invites } = useManyInvites()

	const [currentInvite, ...otherPendingInvites] = invites.filter(
		(i) => i.state === 'pending',
	)

	const router = useRouter()

	const rejectInvite = useRejectInvite()

	const __acceptInvite = useAcceptInvite()
	const acceptInvite = useMutation({
		mutationFn: async ({
			invite,
		}: {
			// NOTE: Used for success and pending dialog content
			invite: InviteApi.Invite
			// NOTE: Used for success and pending dialog content
			remainingInvites: Array<InviteApi.Invite>
		}) => {
			return __acceptInvite.mutateAsync({ inviteId: invite.inviteId })
		},
	})

	const showAcceptInviteIsPending = useSpinDelay(
		acceptInvite.status === 'pending',
		{ delay: 100 },
	)

	const showRejectInviteIsPending = useSpinDelay(
		rejectInvite.status === 'pending',
		{ delay: 100 },
	)

	let dialogContentProps: DialogContentProps | null = null

	const displayedInvite =
		acceptInvite.status === 'pending'
			? acceptInvite.variables.invite
			: currentInvite

	if (acceptInvite.status === 'error') {
		dialogContentProps = {
			status: 'error',
			error: acceptInvite.error,
			onClose: () => {
				acceptInvite.reset()
			},
		}
	} else if (rejectInvite.status === 'error') {
		dialogContentProps = {
			status: 'error',
			error: rejectInvite.error,
			onClose: () => {
				rejectInvite.reset()
			},
		}
	} else if (acceptInvite.status === 'success') {
		dialogContentProps = {
			status: 'success',
			invite: acceptInvite.variables.invite,
			projectId: acceptInvite.data,
			onCloseAcceptedInvite: () => {
				acceptInvite.reset()
			},
			onViewProject: ({ projectId }) => {
				acceptInvite.reset()

				router.navigate({
					to: '/app/projects/$projectId',
					params: { projectId },
				})
			},
			remainingInvites: acceptInvite.variables.remainingInvites,
		}
	} else if (displayedInvite) {
		dialogContentProps = {
			status: 'pending',
			invite: displayedInvite,
			isActionPending:
				acceptInvite.status === 'pending' || rejectInvite.status === 'pending',
			isActionVisiblyPending:
				showAcceptInviteIsPending || showRejectInviteIsPending,
			onAccept: () => {
				if (
					acceptInvite.status === 'pending' ||
					rejectInvite.status === 'pending'
				) {
					return
				}

				acceptInvite.mutate(
					{
						invite: displayedInvite,
						remainingInvites: otherPendingInvites,
					},
					{
						onError: (error) => {
							captureException(error)
						},
					},
				)
			},
			onReject: () => {
				if (
					acceptInvite.status === 'pending' ||
					rejectInvite.status === 'pending'
				) {
					return
				}

				rejectInvite.mutate(
					{ inviteId: displayedInvite.inviteId },
					{
						onError: (error) => {
							captureException(error)
						},
					},
				)
			},
		}
	}

	return (
		<DecentDialog fullWidth maxWidth="sm" value={dialogContentProps}>
			{(value) => <ProjectInviteDialogContent {...value} />}
		</DecentDialog>
	)
}

function ProjectInviteDialogContent(props: DialogContentProps) {
	const intl = useIntl()

	const inviteDetailsIconSize = useIconSizeBasedOnTypography({
		variant: 'cardHeader',
		multiplier: 2,
	})

	const additionalProjectsIconSize = useIconSizeBasedOnTypography({
		variant: 'detailCopy',
		multiplier: 1.5,
	})

	const status = props.status

	switch (status) {
		case 'error': {
			const { error, onClose } = props

			return (
				<ErrorDialogContent errorMessage={error.toString()} onClose={onClose} />
			)
		}
		case 'pending': {
			const {
				invite,
				isActionPending,
				isActionVisiblyPending,
				onAccept,
				onReject,
			} = props

			return (
				<InviteContainer
					actions={
						<InviteActions
							isPending={isActionVisiblyPending}
							primary={
								<Button
									aria-disabled={isActionPending}
									fullWidth
									onClick={() => {
										if (isActionPending) {
											return
										}

										onAccept()
									}}
									variant="contained"
								>
									{intl.formatMessage(m.projectInviteAccept)}
								</Button>
							}
							secondary={
								<Button
									aria-disabled={isActionPending}
									fullWidth
									onClick={() => {
										if (isActionPending) {
											return
										}

										onReject()
									}}
									variant="outlined"
								>
									{intl.formatMessage(m.projectInviteDecline)}
								</Button>
							}
						/>
					}
					details={
						<InviteDetailsCard
							color={invite.projectColor}
							title={invite.projectName}
							description={intl.formatMessage(m.projectInviteDescription, {
								role: invite.roleName?.toLowerCase() || 'participant',
							})}
							icon={
								<Icon
									name={
										invite.roleName === 'Coordinator'
											? 'material-manage-accounts-filled'
											: 'material-people-filled'
									}
									size={inviteDetailsIconSize}
								/>
							}
						/>
					}
					title={intl.formatMessage(m.projectInviteTitle)}
				/>
			)
		}
		case 'success': {
			const {
				invite,
				projectId,
				remainingInvites,
				onViewProject,
				onCloseAcceptedInvite,
			} = props

			const dynamicActionsProps =
				remainingInvites.length > 0
					? {
							primary: (
								<Button
									fullWidth
									onClick={() => {
										onCloseAcceptedInvite()
									}}
									variant="contained"
								>
									{intl.formatMessage(m.projectJoinedNextInvite)}
								</Button>
							),
							secondary: (
								<Stack
									direction="row"
									sx={{ alignItems: 'center', flex: 1, gap: 2 }}
								>
									<Icon
										name="comapeo-send"
										color="primary"
										size={additionalProjectsIconSize}
									/>

									<Typography variant="sectionLabel">
										{intl.formatMessage(m.projectInviteAdditionalInvitesCount, {
											inviteCount: remainingInvites.length,
										})}
									</Typography>
								</Stack>
							),
						}
					: {
							primary: (
								<Button
									fullWidth
									onClick={() => {
										onViewProject({ projectId, remainingInvites })
									}}
									variant="contained"
								>
									{intl.formatMessage(m.projectJoinedViewProject)}
								</Button>
							),
							secondary: (
								<Button
									fullWidth
									onClick={() => {
										onCloseAcceptedInvite()
									}}
									startIcon={<Icon name="material-symbols-cancel" />}
									variant="outlined"
								>
									{intl.formatMessage(m.projectJoinedCloseDialog)}
								</Button>
							),
						}

			return (
				<InviteContainer
					actions={<InviteActions {...dynamicActionsProps} />}
					details={
						<InviteDetailsCard
							color={invite.projectColor}
							description={intl.formatMessage(
								m.projectJoinedDetailsDescription,
								{ projectName: invite.projectName },
							)}
							icon={
								<Icon
									color="success"
									name="material-check-circle-rounded"
									size={inviteDetailsIconSize}
								/>
							}
							title={intl.formatMessage(m.projectJoinedDetailsTitle)}
						/>
					}
					title={
						<>
							{intl.formatMessage(m.projectJoinedTitle)}
							{
								/* // eslint-disable-next-line formatjs/no-literal-string-in-jsx */
								' — '
							}
							<Typography
								component="span"
								variant="inherit"
								sx={{ fontWeight: 'normal' }}
							>
								{intl.formatMessage(
									remainingInvites.length > 0
										? m.projectJoinedAdditionalInvitesWaiting
										: m.projectJoinedNoAdditionalInvitesWaiting,
								)}
							</Typography>
						</>
					}
				/>
			)
		}
		default: {
			throw new ExhaustivenessError(status)
		}
	}
}

function InviteContainer({
	actions,
	details,
	title,
}: {
	actions: ReactNode
	details: ReactNode
	title: ReactNode
}) {
	return (
		<Stack direction="column" sx={{ flex: 1, gap: 6, padding: 6 }}>
			<Stack direction="column" sx={{ gap: 2 }}>
				<Typography variant="sectionLabel">{title}</Typography>

				{details}
			</Stack>

			{actions}
		</Stack>
	)
}

function InviteDetailsCard({
	color,
	description,
	icon,
	title,
}: {
	color?: string
	description: string
	icon: ReactNode
	title: string
}) {
	return (
		<Stack
			direction="column"
			sx={{
				background: color,
				border: `1px solid ${BLUE_05}`,
				borderRadius: 2,
				boxShadow: (theme) => theme.shadows[2],
				flex: 1,
				gap: 6,
				padding: 6,
			}}
		>
			<Stack direction="row" sx={{ alignItems: 'center', gap: 6 }}>
				<Box sx={{ color: (theme) => theme.palette.text.secondary }}>
					{icon}
				</Box>

				<Stack direction="column" sx={{ gap: 2 }}>
					<Typography variant="cardHeader">{title}</Typography>

					<Typography>{description}</Typography>
				</Stack>
			</Stack>
		</Stack>
	)
}

function InviteActions({
	isPending,
	primary,
	secondary,
}: {
	isPending?: boolean
	primary?: ReactNode
	secondary?: ReactNode
}) {
	return (
		<Stack direction="row" sx={{ flex: 1, position: 'relative' }}>
			<Box
				sx={{
					alignItems: 'center',
					bottom: 0,
					display: isPending ? 'flex' : 'none',
					justifyContent: 'center',
					left: 0,
					position: 'absolute',
					right: 0,
					top: 0,
				}}
			>
				<CircularProgress />
			</Box>

			<Stack
				direction="row"
				sx={{
					flex: 1,
					flexWrap: 'wrap',
					gap: 4,
					justifyContent: 'center',
					position: 'relative',
					visibility: isPending ? 'hidden' : 'visible',
				}}
			>
				{secondary}

				{primary}
			</Stack>
		</Stack>
	)
}

const m = defineMessages<{
	readonly projectInviteTitle: NoMessageValues
	readonly projectInviteDescription: { readonly role: string }
	readonly projectInviteDecline: NoMessageValues
	readonly projectInviteAccept: NoMessageValues
	readonly projectJoinedTitle: NoMessageValues
	readonly projectJoinedAdditionalInvitesWaiting: NoMessageValues
	readonly projectJoinedNoAdditionalInvitesWaiting: NoMessageValues
	readonly projectJoinedDetailsTitle: NoMessageValues
	readonly projectJoinedDetailsDescription: {
		readonly projectName: MessageValue
	}
	readonly projectJoinedAdditionalInvitesCount: {
		readonly inviteCount: number | bigint
	}
	readonly projectJoinedNextInvite: NoMessageValues
	readonly projectJoinedCloseDialog: NoMessageValues
	readonly projectJoinedViewProject: NoMessageValues
	readonly projectInviteAdditionalInvitesCount: {
		readonly inviteCount: number | bigint
	}
}>({
	projectInviteTitle: {
		id: '$1.routes.app.route.projectInviteTitle',
		defaultMessage: "You've been invited to…",
		description: 'Title of project invite.',
	},
	projectInviteDescription: {
		id: '$1.routes.app.route.projectInviteDescription',
		defaultMessage:
			'Join as a {role, select, coordinator {coordinator} other {participant}}.',
		description: 'Description for invite containing role being invited as.',
	},
	projectInviteDecline: {
		id: '$1.routes.app.route.projectInviteDecline',
		defaultMessage: 'Decline',
		description: 'Button text for declining project invite.',
	},
	projectInviteAccept: {
		id: '$1.routes.app.route.projectInviteAccept',
		defaultMessage: 'Join',
		description: 'Button text for accepting project invite.',
	},
	projectJoinedTitle: {
		id: '$1.routes.app.route.projectJoinedTitle',
		defaultMessage: 'Project added',
		description:
			'Title of dialog displayed when joining a project successfully.',
	},
	projectJoinedAdditionalInvitesWaiting: {
		id: '$1.routes.app.route.projectJoinedAdditionalInvitesWaiting',
		defaultMessage: 'Additional invites waiting',
		description:
			'Text indicating that there are additional invites waiting to be addressed after successfully joining a project.',
	},
	projectJoinedNoAdditionalInvitesWaiting: {
		id: '$1.routes.app.route.projectJoinedNoAdditionalInvitesWaiting',
		defaultMessage: 'No additional invites waiting',
		description:
			'Text indicating that there are no additional invites waiting to be addressed after successfully joining a project.',
	},
	projectJoinedDetailsTitle: {
		id: '$1.routes.app.route.projectJoinedDetailsTitle',
		defaultMessage: 'Success!',
		description:
			'Title in invite details after successfully joining a project.',
	},
	projectJoinedDetailsDescription: {
		id: '$1.routes.app.route.projectJoinedDetailsDescription',
		defaultMessage: '{projectName} added.',
		description:
			'Description in invite details after successfully joining a project.',
	},
	projectJoinedAdditionalInvitesCount: {
		id: '$1.routes.app.route.projectJoinedAdditionalInvitesCount',
		defaultMessage:
			'{inviteCount, plural, one {# additional invite} other {# additional invites}}…',
		description:
			'Text displaying how many additional invites there are to address.',
	},
	projectJoinedNextInvite: {
		id: '$1.routes.app.route.projectJoinedNextInvite',
		defaultMessage: 'View Next Invite',
		description: 'Text for button to view next pending invite.',
	},
	projectJoinedCloseDialog: {
		id: '$1.routes.app.route.projectJoinedCloseDialog',
		defaultMessage: 'Close',
		description: 'Text for button to close project joined dialog.',
	},
	projectJoinedViewProject: {
		id: '$1.routes.app.route.projectJoinedViewProject',
		defaultMessage: 'View Project',
		description:
			'Text for button to navigate to joined project in project joined dialog.',
	},
	projectInviteAdditionalInvitesCount: {
		id: '$1.routes.app.route.projectInviteAdditionalInvitesCount',
		defaultMessage:
			'{inviteCount, plural, one {# additional invite} other {# additional invites}}…',
		description:
			'Text displaying how many additional invites there are to address.',
	},
})
