import { styled } from '@mui/material/styles'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, BLUE_GREY, COMAPEO_BLUE, WHITE } from '../../colors'
import { Button } from '../Button'
import { Text } from '../Text'

const MenuContainer = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	width: '55%',
	margin: '16px auto',
	position: 'relative',
})
const GoBackButton = styled(Button)<{ disabled?: boolean }>(({ disabled }) => ({
	gap: 8,
	color: BLUE_GREY,
	cursor: disabled ? 'default' : 'pointer',
}))
const BackArrow = styled('span')({
	fontSize: 24,
	color: WHITE,
})
const StepsContainer = styled('div')({
	display: 'flex',
	alignItems: 'center',
})
const Steps = styled('div')({
	display: 'flex',
	alignItems: 'center',
	gap: 16,
})
const Step = styled('div')<{
	active: boolean
	disabled?: boolean
}>(({ active, disabled }) => ({
	backgroundColor: active ? WHITE : 'transparent',
	color: active ? BLACK : BLUE_GREY,
	padding: '12px 32px',
	borderRadius: 20,
	fontWeight: active ? 'bold' : 'normal',
	whiteSpace: 'nowrap',
	cursor: disabled ? 'default' : 'pointer',
	opacity: disabled ? 0.5 : 1,
	'&:hover': {
		backgroundColor: !disabled && !active ? 'rgba(0, 0, 0, 0.1)' : undefined,
	},
}))
const Divider = styled('div')({
	width: 16,
	height: 1,
	backgroundColor: COMAPEO_BLUE,
	alignSelf: 'center',
	margin: '0 12px',
})

interface OnboardingTopMenuProps {
	currentStep: number
}

const m = defineMessages({
	goBack: {
		id: 'components.OnboardingTopMenu.goBack',
		defaultMessage: 'Go back',
	},
	step: {
		id: 'components.OnboardingTopMenu.step',
		defaultMessage: 'Step {number}',
	},
})

export function OnboardingTopMenu({ currentStep }: OnboardingTopMenuProps) {
	const navigate = useNavigate()
	const router = useRouter()
	const { formatMessage } = useIntl()
	const stepToRoute: Record<number, string> = {
		1: 'DataPrivacy',
		2: 'DeviceNamingScreen',
		3: 'CreateJoinProjectScreen',
	}

	const canGoBack = currentStep < 3

	return (
		<MenuContainer>
			<GoBackButton
				onClick={() => {
					if (canGoBack) {
						router.history.back()
					}
				}}
				variant="text"
				aria-label={formatMessage(m.goBack)}
				disabled={!canGoBack}
				sx={{
					'&.Mui-disabled': {
						color: BLUE_GREY,
						opacity: 0.5,
					},
				}}
			>
				<BackArrow aria-hidden="true">←</BackArrow>
				{formatMessage(m.goBack)}
			</GoBackButton>
			<Steps>
				{[1, 2, 3].map((step) => {
					const isDisabled =
						step > currentStep || (currentStep === 3 && step < currentStep)

					return (
						<StepsContainer key={step}>
							<Step
								active={currentStep === step}
								disabled={isDisabled}
								onClick={
									!isDisabled && step < currentStep
										? () => navigate({ to: `/Onboarding/${stepToRoute[step]}` })
										: undefined
								}
							>
								<Text kind="body" bold={currentStep === step}>
									{formatMessage(m.step, { number: step })}
								</Text>
							</Step>
							{step < 3 && <Divider />}
						</StepsContainer>
					)
				})}
			</Steps>
		</MenuContainer>
	)
}
