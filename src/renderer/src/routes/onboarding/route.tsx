import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutationState } from '@tanstack/react-query'
import {
	Outlet,
	createFileRoute,
	useChildMatches,
	useNavigate,
	useRouter,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { COMAPEO_BLUE, DARK_COMAPEO_BLUE, WHITE } from '../../colors'
import { Icon } from '../../components/icon'
import {
	ONBOARDING_ACCEPT_INVITE_MUTATION_KEY,
	ONBOARDING_REJECT_INVITE_MUTATION_KEY,
	useOnboardingRejectInvite,
} from './-shared/queries'

export const Route = createFileRoute('/onboarding')({
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()

	const navigate = useNavigate()
	const { formatMessage: t } = useIntl()

	const currentRouteMatch = useChildMatches({
		select: (matches) => {
			return matches.at(-1)!
		},
	})

	const currentPath = currentRouteMatch.fullPath

	const rejectInvite = useOnboardingRejectInvite()

	const acceptInviteStatus = useMutationState({
		filters: {
			mutationKey: ONBOARDING_ACCEPT_INVITE_MUTATION_KEY,
		},
		select: (mutation) => {
			return mutation.state.status
		},
	})

	const rejectInviteStatus = useMutationState({
		filters: {
			mutationKey: ONBOARDING_REJECT_INVITE_MUTATION_KEY,
		},
		select: (mutation) => {
			return mutation.state.status
		},
	})

	const inviteResponsePending =
		rejectInviteStatus.some((s) => s === 'pending') ||
		acceptInviteStatus.some((s) => s === 'pending')

	return (
		<Box bgcolor={DARK_COMAPEO_BLUE} padding={5} height="100vh">
			<Container
				maxWidth="md"
				component={Box}
				bgcolor={DARK_COMAPEO_BLUE}
				height="100%"
				display="grid"
				gridTemplateRows="auto minmax(0, 1fr)"
				rowGap={5}
			>
				<Stack
					useFlexGap
					direction="row"
					justifyContent="space-between"
					bgcolor={DARK_COMAPEO_BLUE}
				>
					<Box>
						<Button
							variant="text"
							startIcon={<Icon name="material-arrow-back" />}
							aria-disabled={inviteResponsePending}
							onClick={() => {
								if (inviteResponsePending) {
									return
								}

								// TODO: There's probably a better way of doing this...
								if (
									currentRouteMatch.fullPath ===
									'/onboarding/project/join/$inviteId'
								) {
									rejectInvite.mutate(
										{ inviteId: currentRouteMatch.params.inviteId },
										{
											onError: (_err) => {
												// TODO: Sentry
											},
										},
									)
								}

								if (router.history.canGoBack()) {
									router.history.back()
								} else {
									switch (currentPath) {
										case '/onboarding/data-and-privacy': {
											navigate({ to: '/welcome', replace: true })
											break
										}
										case '/onboarding/privacy-policy': {
											navigate({
												to: '/onboarding/data-and-privacy',
												replace: true,
											})
											break
										}
										case '/onboarding/device-name': {
											navigate({
												to: '/onboarding/data-and-privacy',
												replace: true,
											})
											break
										}
										// @ts-expect-error https://github.com/TanStack/router/issues/3780
										case '/onboarding/project/': {
											navigate({
												to: '/onboarding/device-name',
												replace: true,
											})
											break
										}
										case '/onboarding/project/join/$inviteId/':
										case '/onboarding/project/join/$inviteId/success':
										case '/onboarding/project/create': {
											navigate({
												to: '/onboarding/project',
												replace: true,
											})
											break
										}

										default: {
											throw new Error(`Unexpected path: ${currentRouteMatch}`)
										}
									}
								}
							}}
							// TODO: Ideally update the theme appropriately instead
							sx={{ color: WHITE }}
						>
							{t(m.goBack)}
						</Button>
					</Box>
					<Stack useFlexGap direction="row" alignItems="center" gap={4}>
						<StepIndicator
							isActive={
								currentPath === '/onboarding/privacy-policy' ||
								currentPath === '/onboarding/data-and-privacy'
							}
							label={t(m.step, { value: 1 })}
						/>

						<Divider
							aria-hidden="true"
							sx={{
								minWidth: 20,
								maxWidth: 40,
								backgroundColor: COMAPEO_BLUE,
							}}
						/>

						<StepIndicator
							isActive={currentPath === '/onboarding/device-name'}
							label={t(m.step, { value: 2 })}
						/>

						<Divider
							aria-hidden="true"
							sx={{
								minWidth: 20,
								maxWidth: 40,
								backgroundColor: COMAPEO_BLUE,
							}}
						/>

						<StepIndicator
							isActive={
								// @ts-expect-error https://github.com/TanStack/router/issues/3780
								currentPath === '/onboarding/project/' ||
								currentPath === '/onboarding/project/create' ||
								currentPath === '/onboarding/project/join/$inviteId/' ||
								currentPath === '/onboarding/project/join/$inviteId/success'
							}
							label={t(m.step, { value: 3 })}
						/>
					</Stack>
				</Stack>

				<Box component="main" display="flex" flexDirection="column">
					<Outlet />
				</Box>
			</Container>
		</Box>
	)
}

function StepIndicator({
	isActive,
	label,
}: {
	isActive?: boolean
	label: string
}) {
	return (
		<Box
			display="flex"
			flexDirection="row"
			alignItems="center"
			justifyContent="center"
			alignSelf="stretch"
			bgcolor={isActive ? WHITE : undefined}
			borderRadius={6}
			paddingX={10}
		>
			<Typography
				color={isActive ? 'textPrimary' : 'textInverted'}
				fontWeight="bold"
			>
				{label}
			</Typography>
		</Box>
	)
}

const m = defineMessages({
	goBack: {
		id: 'routes.onboarding.route.goBack',
		defaultMessage: 'Go back',
	},
	step: {
		id: 'routes.onboarding.route.step',
		defaultMessage: 'Step {value}',
	},
})
