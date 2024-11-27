import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Button } from '../../components/Button'
import { OnboardingTopMenu } from '../../components/OnboardingTopMenu'
import LockedIcon from '../../images/LockedWithKey.svg'

export const Route = createFileRoute('/Onboarding/DataPrivacy')({
	component: DataPrivacyComponent,
})

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100vh',
	backgroundColor: '#050F77',
})

const ContentBox = styled('div')({
	backgroundColor: '#fff',
	borderRadius: '8px',
	padding: '24px',
	width: '80%',
	textAlign: 'center',
})

const ButtonContainer = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	gap: '16px',
	marginTop: '16px',
})

const StyledIcon = styled(LockedIcon)({
	marginBottom: '16px',
})

export function DataPrivacyComponent() {
	const navigate = useNavigate()

	return (
		<Container>
			<OnboardingTopMenu currentStep={1} />
			<ContentBox>
				<StyledIcon />;<h2>Review Data & Privacy</h2>
				<p>
					CoMapeo allows teams to map offline without needing internet servers.
				</p>
				<ul style={{ textAlign: 'left' }}>
					<li>Your data stays on your devices.</li>
					<li>All data stays fully encrypted.</li>
					<li>Easily manage and control sharing and collaboration.</li>
					<li>
						Private by default — diagnostic information is fully anonymized.
					</li>
				</ul>
				<ButtonContainer>
					<Button
						onClick={() => alert('Learn More clicked!')}
						variant="outlined"
					>
						Learn More
					</Button>
					<Button onClick={() => navigate({ to: '/Onboarding/NextStep' })}>
						Next
					</Button>
				</ButtonContainer>
			</ContentBox>
		</Container>
	)
}
