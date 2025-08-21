import { useEffect } from 'react'
import { useSingleInvite } from '@comapeo/core-react'
import type { Invite } from '@comapeo/core/dist/invite/invite-api'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { captureException } from '@sentry/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
	createFileRoute,
	redirect,
	useNavigate,
	useRouter,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import {
	useOnboardingAcceptInvite,
	useOnboardingRejectInvite,
} from '../../-shared/queries'
import {
	BLACK,
	DARKER_ORANGE,
	DARK_GREY,
	LIGHT_GREY,
	RED,
	WHITE,
} from '../../../../colors'
import { Icon } from '../../../../components/icon'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../lib/comapeo'
import { customNotFound } from '../../../../lib/navigation'
import { setActiveProjectIdMutationOptions } from '../../../../lib/queries/app-settings'

export const Route = createFileRoute('/onboarding/project/join/$inviteId/')({
	loader: async ({ context, params }) => {
		const { clientApi, queryClient, formatMessage } = context
		const { inviteId } = params

		let invite: Invite
		try {
			// TODO: Not ideal but requires changes in @comapeo/core-react
			invite = await queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'invites', { inviteId }],
				queryFn: async () => {
					return clientApi.invite.getById(inviteId)
				},
			})
		} catch {
			throw customNotFound({
				// TODO: Ideally do not need to specify this but it seems that the 'fuzzy' behavior
				// is not working as described in https://tanstack.com/router/latest/docs/framework/react/guide/not-found-errors
				routeId: '/onboarding/project',
				data: {
					message: formatMessage(m.inviteNotFound, {
						inviteId: inviteId.slice(0, 7),
					}),
				},
			})
		}

		// Redirect if the invite of interest cannot be responded to
		if (invite.state !== 'pending') {
			throw redirect({ to: '/onboarding/project', replace: true })
		}
	},
	component: RouteComponent,
})

const BOX_SHADOW = `0px 1px 5px 0px ${alpha(BLACK, 0.25)}`

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const router = useRouter()
	const navigate = useNavigate()
	const { inviteId } = Route.useParams()

	const { data: invite } = useSingleInvite({ inviteId })

	const rejectInvite = useOnboardingRejectInvite()
	const acceptInvite = useOnboardingAcceptInvite()

	const queryClient = useQueryClient()
	const setActiveProjectId = useMutation(
		setActiveProjectIdMutationOptions(queryClient),
	)

	useEffect(() => {
		// Navigate away from the page if the invite gets cancelled from the invitor's side.
		if (invite.state === 'canceled') {
			if (router.history.canGoBack()) {
				router.history.back()
				return
			}

			navigate({ to: '/onboarding/project', replace: true })
		}
	}, [invite.state, router, navigate])

	return (
		<>
			<Stack
				display="flex"
				direction="column"
				justifyContent="space-between"
				flex={1}
				gap={10}
				bgcolor={LIGHT_GREY}
				padding={5}
				borderRadius={2}
				overflow="auto"
			>
				<Container maxWidth="sm" component={Stack} direction="column" gap={5}>
					<Box alignSelf="center">
						<Icon
							name="material-person-add"
							size={80}
							htmlColor={DARKER_ORANGE}
						/>
					</Box>

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.title)}
					</Typography>

					<Typography variant="h2" fontWeight={400} textAlign="center">
						{t(m.description)}
					</Typography>

					<Stack
						direction="column"
						gap={4}
						borderRadius={2}
						padding={6}
						boxShadow={BOX_SHADOW}
						bgcolor={invite.projectColor || WHITE}
						border={`2px solid ${acceptInvite.status === 'error' || rejectInvite.status === 'error' ? RED : LIGHT_GREY}`}
					>
						<Typography variant="h1" fontWeight={500}>
							{invite.projectName}
						</Typography>

						<Typography variant="h2" fontWeight={400} sx={{ color: DARK_GREY }}>
							{t(m.joinAs, { role: invite.roleName?.toLowerCase() })}
						</Typography>
					</Stack>

					{(acceptInvite.status === 'error' ||
						rejectInvite.status === 'error') && (
						<Typography color="error">{t(m.responseError)}</Typography>
					)}
				</Container>

				<Container
					component={Stack}
					direction="row"
					justifyContent="center"
					gap={5}
				>
					<Button
						variant="outlined"
						fullWidth
						sx={{ maxWidth: 400 }}
						// TODO: Consider using spin-delay
						loading={rejectInvite.status === 'pending'}
						loadingPosition="start"
						onClick={() => {
							if (
								acceptInvite.status === 'pending' ||
								rejectInvite.status === 'pending'
							) {
								return
							}

							acceptInvite.reset()
							rejectInvite.reset()

							rejectInvite.mutate(
								{ inviteId },
								{
									onError: (err) => {
										captureException(err)
									},
									onSuccess: () => {
										if (router.history.canGoBack()) {
											router.history.back()
											return
										}

										navigate({ to: '/onboarding/project', replace: true })
									},
								},
							)
						}}
					>
						{t(m.declineInvite)}
					</Button>

					<Button
						variant="contained"
						fullWidth
						sx={{ maxWidth: 400 }}
						// TODO: Consider using spin-delay
						loading={acceptInvite.status === 'pending'}
						loadingPosition="start"
						onClick={() => {
							if (
								acceptInvite.status === 'pending' ||
								rejectInvite.status === 'pending'
							) {
								return
							}

							acceptInvite.reset()
							rejectInvite.reset()

							acceptInvite.mutate(
								{ inviteId },
								{
									onError: (err) => {
										captureException(err)
									},
									onSuccess: (data) => {
										setActiveProjectId.mutate(data, {
											onError: (err) => {
												captureException(err)
											},
											onSuccess: () => {
												navigate({
													to: '/onboarding/project/join/$inviteId/success',
													params: { inviteId },
												})
											},
										})
									},
								},
							)
						}}
					>
						{t(m.joinProject)}
					</Button>
				</Container>
			</Stack>
		</>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.onboarding.project.join.$inviteId.index.title',
		defaultMessage: 'Join a Project',
	},
	description: {
		id: 'routes.onboarding.project.join.$inviteId.index.description',
		defaultMessage: "You're invited to…",
	},
	joinAs: {
		id: 'routes.onboarding.project.join.$inviteId.index.joinAs',
		defaultMessage:
			'Join as a {role, select, coordinator {coordinator} other {participant}}?',
	},
	declineInvite: {
		id: 'routes.onboarding.project.join.$inviteId.index.declineInvite',
		defaultMessage: 'Decline Invite',
	},
	joinProject: {
		id: 'routes.onboarding.project.join.$inviteId.index.joinProject',
		defaultMessage: 'Join Project',
	},
	responseError: {
		id: 'routes.onboarding.project.join.$inviteId.index.responseError',
		defaultMessage: 'Something went wrong. Try again.',
	},
	inviteNotFound: {
		id: 'routes.onboarding.project.join.$inviteId.index.inviteNotFound',
		defaultMessage: 'Could not find invite with ID {inviteId}',
		description: 'Text displayed when invite cannot be found.',
	},
})
