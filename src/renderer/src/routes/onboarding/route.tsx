import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useIsMutating } from '@tanstack/react-query'
import {
	Outlet,
	createFileRoute,
	redirect,
	useChildMatches,
	useNavigate,
	useRouter,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { COMAPEO_BLUE, DARK_COMAPEO_BLUE, WHITE } from '../../colors'
import { Icon } from '../../components/icon'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../lib/comapeo'
import {
	ONBOARDING_ACCEPT_INVITE_MUTATION_KEY,
	ONBOARDING_CREATE_PROJECT_MUTATION_KEY,
	ONBOARDING_REJECT_INVITE_MUTATION_KEY,
	useOnboardingRejectInvite,
} from './-shared/queries'

export const Route = createFileRoute('/onboarding')({
	beforeLoad: async ({ context }) => {
		const { activeProjectIdStore, clientApi, queryClient } = context

		const activeProjectId = activeProjectIdStore.instance.getState()

		if (activeProjectId) {
			throw redirect({
				to: '/app/projects/$projectId',
				params: { projectId: activeProjectId },
				replace: true,
			})
		}

		// NOTE: Accounts for when the active project ID is somehow missing
		// but there are already projects that have been created/joined.
		// The better solution is probably a project selection page of some sort,
		// as opposed to automatic redirection to a valid project.

		const projects = await queryClient.ensureQueryData({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects'],
			queryFn: async () => {
				return clientApi.listProjects()
			},
		})

		const projectToUse = projects[0]

		if (projectToUse) {
			throw redirect({
				to: '/app/projects/$projectId',
				params: { projectId: projectToUse.projectId },
				replace: true,
			})
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()

	const navigate = useNavigate()
	const { formatMessage: t } = useIntl()

	const currentRoute = useChildMatches({
		select: (matches) => {
			return matches.at(-1)!
		},
	})

	const rejectInvite = useOnboardingRejectInvite()

	const isAcceptingInvite =
		useIsMutating({ mutationKey: ONBOARDING_ACCEPT_INVITE_MUTATION_KEY }) > 0

	const isRejectingInvite =
		useIsMutating({ mutationKey: ONBOARDING_REJECT_INVITE_MUTATION_KEY }) > 0

	const isCreatingProject =
		useIsMutating({ mutationKey: ONBOARDING_CREATE_PROJECT_MUTATION_KEY }) > 0

	const importantMutationInProgress =
		isAcceptingInvite || isRejectingInvite || isCreatingProject

	const shouldHideBackButton =
		currentRoute.routeId === '/onboarding/project/create/$projectId/success' ||
		currentRoute.routeId === '/onboarding/project/join/$inviteId/success'

	return (
		<Box bgcolor={DARK_COMAPEO_BLUE} padding={5} height="100%">
			<Container
				maxWidth="md"
				component={Box}
				height="100%"
				display="grid"
				gridTemplateRows="auto minmax(0, 1fr)"
				rowGap={5}
			>
				<Stack direction="row" justifyContent="space-between">
					<Box>
						<Button
							variant="text"
							startIcon={<Icon name="material-arrow-back" />}
							aria-disabled={
								importantMutationInProgress || shouldHideBackButton
							}
							onClick={() => {
								if (importantMutationInProgress || shouldHideBackButton) {
									return
								}

								// TODO: There's probably a better way of doing this...
								if (
									currentRoute.routeId === '/onboarding/project/join/$inviteId/'
								) {
									// TODO: Should we block navigation if this fails?
									rejectInvite.mutate(
										{ inviteId: currentRoute.params.inviteId },
										{
											onError: (err) => {
												captureException(err)
											},
										},
									)
								}

								if (router.history.canGoBack()) {
									router.history.back()
								} else {
									switch (currentRoute.routeId) {
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

										case '/onboarding/project/': {
											navigate({
												to: '/onboarding/device-name',
												replace: true,
											})
											break
										}
										case '/onboarding/project/join/$inviteId/':
										case '/onboarding/project/create/': {
											navigate({
												to: '/onboarding/project',
												replace: true,
											})
											break
										}

										default: {
											throw new Error(
												`Unexpected route ID: ${currentRoute.routeId}`,
											)
										}
									}
								}
							}}
							// TODO: Ideally update the theme appropriately instead
							sx={{
								color: WHITE,
								visibility: shouldHideBackButton ? 'hidden' : undefined,
							}}
						>
							{t(m.goBack)}
						</Button>
					</Box>
					<Stack direction="row" alignItems="center" gap={4}>
						<StepIndicator
							isActive={
								currentRoute.routeId === '/onboarding/privacy-policy' ||
								currentRoute.routeId === '/onboarding/data-and-privacy'
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
							isActive={currentRoute.routeId === '/onboarding/device-name'}
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
							isActive={currentRoute.fullPath.startsWith(
								'/onboarding/project/',
							)}
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
