import { Suspense } from 'react'
import {
	useAcceptInvite,
	useManyInvites,
	useRejectInvite,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Zoom from '@mui/material/Zoom'
import { captureException } from '@sentry/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import { TransitionGroup } from 'react-transition-group'

import { ONBOARDING_BASE_MUTATION_KEY } from '../-shared'
import { BLUE_GREY, DARKER_ORANGE, DARK_GREY, WHITE } from '../../../../colors'
import {
	ErrorDialog,
	type Props as ErrorDialogProps,
} from '../../../../components/error-dialog'
import { Icon } from '../../../../components/icon'

export const Route = createFileRoute('/onboarding/project/join/')({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	return (
		<Container maxWidth="sm" component={Stack} direction="column" gap={10}>
			<Stack direction="column" gap={2}>
				<Box alignSelf="center">
					<Icon
						name="material-people-filled"
						htmlColor={DARKER_ORANGE}
						size={80}
					/>
				</Box>

				<Typography variant="h1" fontWeight={500} textAlign="center">
					{t(m.title)}
				</Typography>
			</Stack>

			<Typography variant="h2" fontWeight={400} textAlign="center">
				{t(m.description)}
			</Typography>

			<Suspense>
				<PendingInvite />
			</Suspense>
		</Container>
	)
}

function PendingInvite() {
	const router = useRouter()

	const { formatMessage: t } = useIntl()

	const { data: invites } = useManyInvites()

	const pendingInvite = invites.find((i) => i.state === 'pending')

	const acceptInvite = useAcceptInvite()
	const acceptOnboardingInvite = useMutation({
		mutationKey: [...ONBOARDING_BASE_MUTATION_KEY, 'invite', 'accept'],
		mutationFn: async (opts: { inviteId: string }) => {
			return acceptInvite.mutateAsync(opts)
		},
	})

	const rejectInvite = useRejectInvite()
	const rejectOnboardingInvite = useMutation({
		mutationKey: [...ONBOARDING_BASE_MUTATION_KEY, 'invite', 'reject'],
		mutationFn: async (opts: { inviteId: string }) => {
			return rejectInvite.mutateAsync(opts)
		},
	})

	const errorDialogProps: ErrorDialogProps =
		rejectOnboardingInvite.status === 'error'
			? {
					open: true,
					errorMessage: rejectOnboardingInvite.error.toString(),
					onClose: () => {
						rejectOnboardingInvite.reset()
					},
				}
			: acceptOnboardingInvite.status === 'error'
				? {
						open: true,
						errorMessage: acceptOnboardingInvite.error.toString(),
						onClose: () => {
							acceptOnboardingInvite.reset()
						},
					}
				: { onClose: () => {}, open: false }

	return (
		<>
			<TransitionGroup style={{ position: 'relative' }}>
				{acceptOnboardingInvite.status === 'pending' ? (
					<Zoom mountOnEnter unmountOnExit>
						<Box display="flex" flexDirection="row" justifyContent="center">
							<CircularProgress disableShrink />
						</Box>
					</Zoom>
				) : pendingInvite ? (
					<Zoom key={pendingInvite.inviteId} mountOnEnter unmountOnExit>
						<Stack
							position="absolute"
							top={0}
							right={0}
							left={0}
							direction="column"
							gap={6}
							borderRadius={2}
							padding={6}
							boxShadow={(theme) => theme.shadows[5]}
							bgcolor={pendingInvite.projectColor || WHITE}
							border={`1px solid ${BLUE_GREY}`}
						>
							<Typography variant="h1" fontWeight={500}>
								{pendingInvite.projectName}
							</Typography>

							<Typography
								variant="h2"
								fontWeight={400}
								sx={{ color: DARK_GREY }}
							>
								{t(m.inviteDescription, {
									role: pendingInvite.roleName?.toLowerCase(),
								})}
							</Typography>

							<Stack direction="row" gap={4}>
								<Button
									variant="outlined"
									fullWidth
									aria-disabled={rejectOnboardingInvite.status === 'pending'}
									loading={rejectOnboardingInvite.status === 'pending'}
									loadingPosition="start"
									onClick={() => {
										if (rejectOnboardingInvite.status === 'pending') {
											return
										}

										rejectOnboardingInvite.mutate(
											{ inviteId: pendingInvite.inviteId },
											{
												onError: (err) => {
													captureException(err)
												},
											},
										)
									}}
									sx={{ maxWidth: 400 }}
								>
									{t(m.declineButton)}
								</Button>

								<Button
									variant="contained"
									fullWidth
									aria-disabled={rejectOnboardingInvite.status === 'pending'}
									onClick={() => {
										if (rejectOnboardingInvite.status === 'pending') {
											return
										}

										acceptOnboardingInvite.mutate(
											{ inviteId: pendingInvite.inviteId },
											{
												onError: (err) => {
													captureException(err)
												},
												onSuccess: async (projectId) => {
													await router.navigate({
														to: '/onboarding/project/join/$inviteId/success',
														params: { inviteId: pendingInvite.inviteId },
														search: { projectId },
													})
												},
											},
										)
									}}
									loadingPosition="start"
									sx={{ maxWidth: 400 }}
								>
									{t(m.acceptButton)}
								</Button>
							</Stack>
						</Stack>
					</Zoom>
				) : null}
			</TransitionGroup>

			<ErrorDialog {...errorDialogProps} />
		</>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.onboarding.project.join.index.title',
		defaultMessage: 'Join a Project',
		description: 'Title for onboarding join project landing page.',
	},
	description: {
		id: 'routes.onboarding.project.join.index.description',
		defaultMessage:
			'Coordinate with your team to receive a project invitation.',
		description: 'Description for onboarding join project landing page.',
	},
	inviteDescription: {
		id: 'routes.onboarding.project.join.index.inviteDescription',
		defaultMessage:
			'Join as a {role, select, coordinator {coordinator} other {participant}}?',
		description: 'Description for invite containing role being invited as.',
	},
	declineButton: {
		id: 'routes.onboarding.project.join.index.declineButton',
		defaultMessage: 'Decline',
		description: 'Text for button to decline invitation.',
	},
	acceptButton: {
		id: 'routes.onboarding.project.join.index.acceptButton',
		defaultMessage: 'Accept',
		description: 'Text for button to accept invitation.',
	},
})
