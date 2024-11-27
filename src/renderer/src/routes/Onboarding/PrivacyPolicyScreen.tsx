import { styled } from '@mui/material/styles'
import { createFileRoute } from '@tanstack/react-router'

import { BLUE_GREY, DARK_COMAPEO_BLUE } from '../../colors'
import { OnboardingTopMenu } from '../../components/OnboardingTopMenu'
import { PrivacyPolicy } from '../../components/PrivacyPolicy'

export const Route = createFileRoute('/Onboarding/PrivacyPolicyScreen')({
	component: PrivacyPolicyScreen,
})

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100%',
	backgroundColor: DARK_COMAPEO_BLUE,
})
const ContentBox = styled('div')({
	width: '55%',
	height: '80%',
	backgroundColor: '#FFFFFF',
	padding: '20px 30px',
	borderRadius: 8,
	border: `1px solid ${BLUE_GREY}`,
	margin: '16px auto',
	boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.02)',
	overflowY: 'auto',
})

export function PrivacyPolicyScreen() {
	return (
		<Container>
			<OnboardingTopMenu currentStep={1} />
			<ContentBox>
				<PrivacyPolicy />
			</ContentBox>
		</Container>
	)
}
