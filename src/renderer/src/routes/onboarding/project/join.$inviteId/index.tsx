import { useSingleInvite } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
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
import { useActiveProjectIdStoreActions } from '../../../../contexts/ActiveProjectIdProvider'

export const Route = createFileRoute('/onboarding/project/join/$inviteId/')({
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

	const { setActiveProjectId } = useActiveProjectIdStoreActions()

	return (
		<Stack
			display="flex"
			useFlexGap
			direction="column"
			justifyContent="space-between"
			flex={1}
			gap={10}
			bgcolor={LIGHT_GREY}
			padding={5}
			borderRadius={2}
			overflow="auto"
		>
			<Container
				maxWidth="sm"
				component={Stack}
				direction="column"
				useFlexGap
				gap={5}
			>
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
					useFlexGap
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
				useFlexGap
				gap={5}
			>
				<Button
					variant="outlined"
					size="large"
					disableElevation
					fullWidth
					sx={{ maxWidth: 400 }}
					// TODO: Consider using spin-delay
					loading={rejectInvite.status === 'pending'}
					loadingPosition="start"
					onClick={() => {
						if (acceptInvite.status === 'pending') {
							return
						}

						acceptInvite.reset()
						rejectInvite.reset()

						rejectInvite.mutate(
							{ inviteId },
							{
								onError: (_err) => {
									// TODO: Sentry
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
					size="large"
					disableElevation
					fullWidth
					sx={{ maxWidth: 400 }}
					// TODO: Consider using spin-delay
					loading={acceptInvite.status === 'pending'}
					loadingPosition="start"
					onClick={() => {
						if (rejectInvite.status === 'pending') {
							return
						}

						acceptInvite.reset()
						rejectInvite.reset()

						acceptInvite.mutate(
							{ inviteId },
							{
								onSuccess: (data) => {
									setActiveProjectId(data)

									navigate({
										to: '/onboarding/project/join/$inviteId/success',
										params: { inviteId },
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
})
