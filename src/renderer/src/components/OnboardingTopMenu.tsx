import { styled } from '@mui/material/styles'
import { useNavigate } from '@tanstack/react-router'

const MenuContainer = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	width: '90%',
	marginBottom: '32px',
	color: '#fff',
})

const Steps = styled('div')({
	display: 'flex',
	alignItems: 'center',
	gap: '8px',
})

const Step = styled('div')(({ active }: { active: boolean }) => ({
	backgroundColor: active ? '#fff' : 'transparent',
	color: active ? '#000' : '#fff',
	padding: '4px 12px',
	borderRadius: '16px',
}))

interface OnboardingTopMenuProps {
	currentStep: number
}

export function OnboardingTopMenu({ currentStep }: OnboardingTopMenuProps) {
	const navigate = useNavigate()

	return (
		<MenuContainer>
			<button onClick={() => navigate({ to: '/Onboarding' })}>← Go Back</button>
			<Steps>
				{['Step 1', 'Step 2', 'Step 3'].map((step, index) => (
					<Step key={step} active={currentStep === index + 1}>
						{step}
					</Step>
				))}
			</Steps>
		</MenuContainer>
	)
}
