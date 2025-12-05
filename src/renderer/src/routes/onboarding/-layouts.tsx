import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import {
	BLUE_GREY,
	COMAPEO_BLUE,
	DARK_COMAPEO_BLUE,
	LIGHT_GREY,
	WHITE,
} from '#renderer/src/colors.ts'
import { Icon } from '#renderer/src/components/icon.tsx'

export function BasicLayout({
	backStatus,
	children,
	onBack,
}: {
	backStatus: 'enabled' | 'hidden' | 'disabled'
	children: ReactNode
	onBack?: () => void
}) {
	const { formatMessage: t } = useIntl()

	return (
		<Box bgcolor={DARK_COMAPEO_BLUE} padding={5} height="100%">
			<Container maxWidth="md" sx={{ height: '100%' }}>
				<Box
					display="grid"
					height="100%"
					gridTemplateRows="auto minmax(0, 1fr)"
					bgcolor={LIGHT_GREY}
					borderRadius={2}
				>
					<Box
						paddingInline={4}
						paddingBlock={2}
						borderBottom={
							backStatus === 'hidden' ? undefined : `1px solid ${BLUE_GREY}`
						}
					>
						{backStatus === 'hidden' ? null : (
							<Button
								variant="text"
								startIcon={<Icon name="material-arrow-back" />}
								aria-disabled={backStatus === 'disabled'}
								onClick={
									onBack
										? () => {
												onBack()
											}
										: undefined
								}
							>
								{t(m.goBack)}
							</Button>
						)}
					</Box>

					<Box component="main" display="flex" flexDirection="column">
						<Stack
							display="flex"
							direction="column"
							justifyContent="space-between"
							flex={1}
							gap={10}
							padding={10}
							overflow="auto"
						>
							{children}
						</Stack>
					</Box>
				</Box>
			</Container>
		</Box>
	)
}

export function StepLayout({
	children,
	onBack,
	stepNumber,
}: {
	children: ReactNode
	onBack?: () => void
	stepNumber: 1 | 2 | 3
}) {
	const { formatMessage: t } = useIntl()

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
							aria-disabled={!onBack}
							onClick={
								onBack
									? () => {
											onBack()
										}
									: undefined
							}
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

						<Divider
							aria-hidden="true"
							sx={{
								minWidth: 20,
								maxWidth: 40,
								backgroundColor: COMAPEO_BLUE,
							}}
						/>

						<StepIndicator
							isActive={stepNumber === 3}
							label={t(m.step, { value: 3 })}
						/>
					</Stack>
				</Stack>

				<Box component="main" display="flex" flexDirection="column">
					<Stack
						display="flex"
						direction="column"
						justifyContent="space-between"
						flex={1}
						gap={10}
						bgcolor={LIGHT_GREY}
						padding={10}
						borderRadius={2}
						overflow="auto"
					>
						{children}
					</Stack>
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
		id: 'routes.onboarding.-layouts.goBack',
		defaultMessage: 'Go back',
		description: 'Button text for button to navigate back in onboarding steps.',
	},
	step: {
		id: 'routes.onboarding.-layouts.step',
		defaultMessage: 'Step {value}',
		description: 'Text indicating step number in onboarding.',
	},
})
