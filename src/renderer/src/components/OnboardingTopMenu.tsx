import { styled } from '@mui/material/styles'
import { useNavigate } from '@tanstack/react-router'

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
	gap: '8px',
	backgroundColor: 'transparent',
	color: BLUE_GREY,
	fontSize: '16px',
	padding: '12px 32px',
	borderRadius: '20px',
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

export function OnboardingTopMenu({ currentStep }: OnboardingTopMenuProps) {
	const navigate = useNavigate()

	return (
		<MenuContainer>
			<GoBackButton
				onClick={() => navigate({ to: '/Onboarding' })}
				variant="text"
				style={{
					color: BLUE_GREY,
					fontWeight: 500,
					alignItems: 'center',
					gap: 8,
					backgroundColor: 'transparent',
					padding: '12px 32px',
				}}
			>
				<BackArrow>←</BackArrow>
				Go back
			</GoBackButton>
			<Steps>
				{['Step 1', 'Step 2', 'Step 3'].map((step, index) => (
					<div key={step} style={{ display: 'flex', alignItems: 'center' }}>
						<Step
							active={currentStep === index + 1}
							onClick={() =>
								navigate({
									to: `/Onboarding/${
										index === 0
											? 'DataPrivacy' // Example: current step
											: 'FutureStep' // TODO: Replace with actual route
									}`,
								})
							}
						>
							<Text kind="body" bold={currentStep === index + 1}>
								{step}
							</Text>
						</Step>
						{index < 2 && <Divider />}
					</div>
				))}
			</Steps>
		</MenuContainer>
	)
}
