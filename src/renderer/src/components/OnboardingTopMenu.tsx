import { styled } from '@mui/material/styles'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, BLUE_GREY, COMAPEO_BLUE, WHITE } from '../colors'
import { Button } from './Button'
import { Text } from './Text'

const MenuContainer = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	width: '55%',
	margin: '16px auto',
	position: 'relative',
})

const GoBackButton = styled(Button)({
	display: 'flex',
	alignItems: 'center',
	gap: 8,
	backgroundColor: 'transparent',
	color: BLUE_GREY,
	fontSize: 16,
	padding: '12px 32px',
	borderRadius: 20,
	whiteSpace: 'nowrap',
	'&:hover': {
		backgroundColor: 'rgba(0, 0, 0, 0.1)',
	},
})

const BackArrow = styled('span')({
	fontSize: 24,
	color: WHITE,
})

const Steps = styled('div')({
	display: 'flex',
	alignItems: 'center',
	gap: 16,
})

const Step = styled('div')(({ active }: { active: boolean }) => ({
	backgroundColor: active ? WHITE : 'transparent',
	color: active ? BLACK : BLUE_GREY,
	padding: '12px 32px',
	borderRadius: 20,
	fontWeight: active ? 'bold' : 'normal',
	whiteSpace: 'nowrap',
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

	return (
		<MenuContainer>
			<GoBackButton
				onClick={() => router.history.back()}
				variant="text"
				style={{
					color: BLUE_GREY,
					gap: 8,
					padding: '12px 32px',
				}}
			>
				<BackArrow>←</BackArrow>
				{formatMessage(m.goBack)}
			</GoBackButton>
			<Steps>
				{[1, 2, 3].map((step) => (
					<div key={step} style={{ display: 'flex', alignItems: 'center' }}>
						<Step
							active={currentStep === step}
							onClick={() =>
								navigate({
									to: `/Onboarding/${
										step === 1
											? 'DataPrivacy'
											: step === 2
												? 'NextStep'
												: 'PrivacyPolicyScreen'
									}`,
								})
							}
						>
							<Text kind="body" bold={currentStep === step}>
								{formatMessage(m.step, { number: step })}
							</Text>
						</Step>
						{step < 3 && <Divider />}
					</div>
				))}
			</Steps>
		</MenuContainer>
	)
}
