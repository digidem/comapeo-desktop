import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
	Outlet,
	createFileRoute,
	useChildMatches,
	useRouter,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { COMAPEO_BLUE, DARK_COMAPEO_BLUE, WHITE } from '../../colors'
import { Icon } from '../../components/icon'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../lib/comapeo'

export const Route = createFileRoute('/onboarding')({
	beforeLoad: async ({ context }) => {
		const { activeProjectIdStore, clientApi, queryClient } = context

		const activeProjectId = activeProjectIdStore.instance.getState()

		if (activeProjectId) {
			throw Route.redirect({
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

		if (projects.length > 0) {
			throw Route.redirect({ to: '/app', replace: true })
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()

	const { formatMessage: t } = useIntl()

	const currentRoute = useChildMatches({
		select: (matches) => {
			return matches.at(-1)!
		},
	})

	const stepNumber = currentRoute.staticData?.onboardingStepNumber

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
							onClick={() => {
								if (router.history.canGoBack()) {
									router.history.back()
									return
								}

								if (currentRoute.routeId === '/onboarding/data-and-privacy') {
									router.navigate({
										to: '/welcome',
										replace: true,
									})
								} else if (
									currentRoute.routeId === '/onboarding/privacy-policy'
								) {
									router.navigate({
										to: '/onboarding/data-and-privacy',
										replace: true,
									})
								} else if (currentRoute.routeId === '/onboarding/device-name') {
									router.navigate({
										to: '/onboarding/data-and-privacy',
										replace: true,
									})
								} else {
									throw new Error(`Unexpected route ID ${currentRoute.routeId}`)
								}
							}}
							// TODO: Ideally update the theme appropriately instead
							sx={{ color: WHITE }}
						>
							{t(m.goBack)}
						</Button>
					</Box>

					<Stack direction="row" alignItems="center" gap={4}>
						<StepIndicator
							isActive={stepNumber === 1}
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
							isActive={stepNumber === 2}
							label={t(m.step, { value: 2 })}
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
		description: 'Button text for button to navigate back in onboarding steps.',
	},
	step: {
		id: 'routes.onboarding.route.step',
		defaultMessage: 'Step {value}',
		description: 'Text indicating step number in onboarding.',
	},
})
