import { styled } from '@mui/material/styles'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, BLUE_GREY, COMAPEO_BLUE, WHITE } from '../../colors'
import { Button } from '../Button'
import { Text } from '../Text'

const MenuContainer = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	width: '55%',
	margin: '20px auto',
	position: 'relative',
})
const GoBackButton = styled(Button)<{ disabled?: boolean }>(({ disabled }) => ({
	gap: 12,
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
	gap: 12,
})
const Step = styled('div')<{
	active: boolean
}>(({ active }) => ({
	backgroundColor: active ? WHITE : 'transparent',
	color: active ? BLACK : BLUE_GREY,
	padding: '12px 32px',
	borderRadius: 20,
	fontWeight: active ? 'bold' : 'normal',
	whiteSpace: 'nowrap',
	cursor: 'default',
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
	onBackPress?: () => void
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

export function OnboardingTopMenu({
	currentStep,
	onBackPress,
}: OnboardingTopMenuProps) {
	const { formatMessage } = useIntl()

	return (
		<MenuContainer>
			<GoBackButton
				onClick={onBackPress}
				variant="text"
				aria-label={formatMessage(m.goBack)}
				disabled={!onBackPress}
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
				{[1, 2, 3].map((step) => (
					<StepsContainer key={step}>
						<Step active={currentStep === step}>
							<Text kind="body" bold={currentStep === step}>
								{formatMessage(m.step, { number: step })}
							</Text>
						</Step>
						{step < 3 && <Divider />}
					</StepsContainer>
				))}
			</Steps>
		</MenuContainer>
	)
}
