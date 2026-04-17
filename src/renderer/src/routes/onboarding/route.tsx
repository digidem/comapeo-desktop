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
		const { clientApi, queryClient } = context

		const ownDeviceInfo = await queryClient.fetchQuery({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
			queryFn: async () => {
				return clientApi.getDeviceInfo()
			},
		})

		// NOTE: No need to go through onboarding if device name has already been set.
		if (ownDeviceInfo.name) {
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
		<Box sx={{ bgcolor: DARK_COMAPEO_BLUE, padding: 5, height: '100%' }}>
			<Container
				maxWidth="md"
				component={Box}
				sx={{
					height: '100%',
					display: 'grid',
					gridTemplateRows: 'auto minmax(0, 1fr)',
					rowGap: 5,
				}}
			>
				<Stack direction="row" sx={{ justifyContent: 'space-between' }}>
					<Box>
						<Button
							variant="text"
							startIcon={<Icon name="material-arrow-back" />}
							onClick={() => {
								if (router.history.canGoBack()) {
									router.history.back()
									return
								}

								if (currentRoute.fullPath === '/onboarding/data-and-privacy') {
									router.navigate({ to: '/welcome', replace: true })
								} else if (
									currentRoute.fullPath === '/onboarding/privacy-policy'
								) {
									router.navigate({
										to: '/onboarding/data-and-privacy',
										replace: true,
									})
								} else if (
									currentRoute.fullPath === '/onboarding/device-name'
								) {
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

					<Stack direction="row" sx={{ alignItems: 'center', gap: 4 }}>
						<StepIndicator
							isActive={stepNumber === 1}
							label={t(m.step, { value: 1 })}
						/>

						<Divider
							aria-hidden="true"
							sx={{ minWidth: 20, maxWidth: 40, backgroundColor: COMAPEO_BLUE }}
						/>

						<StepIndicator
							isActive={stepNumber === 2}
							label={t(m.step, { value: 2 })}
						/>
					</Stack>
				</Stack>

				<Box component="main" sx={{ display: 'flex', flexDirection: 'column' }}>
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
			sx={{
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'center',
				alignSelf: 'stretch',
				bgcolor: isActive ? WHITE : undefined,
				borderRadius: 6,
				paddingX: 10,
			}}
		>
			<Typography
				color={isActive ? 'textPrimary' : 'textInverted'}
				sx={{ fontWeight: 'bold' }}
			>
				{label}
			</Typography>
		</Box>
	)
}

const m = defineMessages({
	goBack: {
		id: '$1.routes.onboarding.route.goBack',
		defaultMessage: 'Go back',
		description: 'Button text for button to navigate back in onboarding steps.',
	},
	step: {
		id: '$1.routes.onboarding.route.step',
		defaultMessage: 'Step {value}',
		description: 'Text indicating step number in onboarding.',
	},
})
