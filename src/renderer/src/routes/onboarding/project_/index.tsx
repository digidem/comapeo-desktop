import { useOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Navigate, createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DARKER_ORANGE, GREEN, WHITE } from '#renderer/src/colors.ts'
import { Icon } from '#renderer/src/components/icon.tsx'
import { ButtonLink } from '#renderer/src/components/link.tsx'

import { StepLayout } from '../-layouts.tsx'

export const Route = createFileRoute('/onboarding/project/')({
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()

	const { formatMessage: t } = useIntl()

	const { data: deviceInfo } = useOwnDeviceInfo()

	// NOTE: Shouldn't happen due to loader in `/onboarding/project/route.tsx` but helpful for guaranteeing state.
	if (!deviceInfo.name) {
		return <Navigate to="/onboarding/device-name" replace />
	}

	return (
		<StepLayout
			stepNumber={3}
			onBack={() => {
				if (router.history.canGoBack()) {
					router.history.back()
				} else {
					router.navigate({
						to: '/onboarding/device-name',
						replace: true,
					})
				}
			}}
		>
			<Container
				maxWidth="sm"
				component={Stack}
				direction="column"
				gap={10}
				textAlign="center"
			>
				<Stack direction="column" gap={5}>
					<Box alignSelf="center">
						<Box position="relative">
							<Icon
								name="material-symbols-computer"
								size={80}
								htmlColor={DARKER_ORANGE}
							/>

							<Box
								bgcolor={GREEN}
								right={(theme) => theme.spacing(-2)}
								bottom={(theme) => theme.spacing(2)}
								sx={{
									position: 'absolute',
									borderRadius: '50%',
									padding: 1,
									display: 'flex',
								}}
							>
								<Icon name="material-check" htmlColor={WHITE} size={24} />
							</Box>
						</Box>
					</Box>

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.title, { name: deviceInfo.name })}
					</Typography>
				</Stack>

				<Typography variant="h2" fontWeight={400} textAlign="center">
					{t(m.description)}
				</Typography>
			</Container>

			<Stack direction="row" gap={4} justifyContent="center">
				<ButtonLink
					to="/onboarding/project/create"
					variant="outlined"
					fullWidth
					startIcon={<Icon name="material-manage-accounts-filled" />}
					sx={{ maxWidth: 400 }}
				>
					{t(m.startProjectButton)}
				</ButtonLink>

				<ButtonLink
					to="/onboarding/project/join"
					variant="contained"
					fullWidth
					startIcon={<Icon name="material-people-filled" />}
					sx={{ maxWidth: 400 }}
				>
					{t(m.joinProjectButton)}
				</ButtonLink>
			</Stack>
		</StepLayout>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.onboarding.project.index.title',
		defaultMessage: '{name} is ready!',
		description: 'Title for the project onboarding landing page.',
	},
	description: {
		id: 'routes.onboarding.project.index.description',
		defaultMessage: 'Choose from below to start your first project.',
		description:
			'Description shown about actions to take in the project onboarding landing page.',
	},
	startProjectButton: {
		id: 'routes.onboarding.project.index.startProjectButton',
		defaultMessage: 'Start New Project',
		description: 'Text for link to start a project.',
	},
	joinProjectButton: {
		id: 'routes.onboarding.project.index.joinProjectButton',
		defaultMessage: 'Join a Project',
		description: 'Text for link to join a project.',
	},
})
