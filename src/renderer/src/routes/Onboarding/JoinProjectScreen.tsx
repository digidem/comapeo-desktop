import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, COMAPEO_BLUE, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingScreenLayout } from '../../components/Onboarding/OnboardingScreenLayout'
import { OnboardingTopMenu } from '../../components/Onboarding/OnboardingTopMenu'
import { Text } from '../../components/Text'
import AddPersonIcon from '../../images/add_person_solid.png'

export const m = defineMessages({
	title: {
		id: 'screens.JoinProjectScreen.title',
		defaultMessage: 'Join',
	},
	invitedTitle: {
		id: 'screens.JoinProjectScreen.invitedTitle',
		defaultMessage: "You've been invited to join",
	},
	declineInvite: {
		id: 'screens.JoinProjectScreen.declineInvite',
		defaultMessage: 'Decline Invite',
	},
	joinProject: {
		id: 'screens.JoinProjectScreen.joinProject',
		defaultMessage: 'Join Project',
	},
})

const IconContainer = styled('div')({
	position: 'relative',
	width: 72,
	height: 72,
	borderRadius: '50%',
	backgroundColor: WHITE,
	boxShadow: '0px 0px 12px 0px #999999',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	margin: '0 auto 12px auto',
})

const StyledIcon = styled('img')({
	width: 33,
	height: 30,
})

export const Route = createFileRoute('/Onboarding/JoinProjectScreen')({
	component: JoinProjectScreenComponent,
})

function JoinProjectScreenComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()
	// TODO: Add logic to show invited project name
	const projectName = 'Example Project'

	const handleDecline = () => {
		navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
	}

	const handleJoin = () => {
		// TODO: Add logic to join project
		navigate({ to: '/Tab1' })
	}

	const topMenu = (
		<OnboardingTopMenu
			currentStep={3}
			onBackPress={() =>
				navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
			}
		/>
	)

	return (
		<OnboardingScreenLayout topMenu={topMenu}>
			<IconContainer>
				<StyledIcon src={AddPersonIcon} alt="Add Person" />
			</IconContainer>
			<Text kind="title" style={{ marginTop: 12 }}>
				{formatMessage(m.title)}
			</Text>
			<div style={{ width: '100%', flexGrow: 1 }}>
				<div style={{ textAlign: 'center' }}>
					<Text bold kind="title">
						{projectName}
					</Text>
				</div>
				<div style={{ textAlign: 'center', margin: '80px 0' }}>
					<Text style={{ fontSize: '1.25rem', color: BLACK, marginBottom: 12 }}>
						{formatMessage(m.invitedTitle)}
					</Text>
					<Text bold style={{ fontSize: '1.25rem' }}>
						{projectName}
					</Text>
				</div>
			</div>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					gap: 12,
					width: '100%',
				}}
			>
				<Button
					variant="outlined"
					style={{
						backgroundColor: WHITE,
						color: BLACK,
						width: '100%',
						padding: '12px 20px',
					}}
					onClick={handleDecline}
				>
					{formatMessage(m.declineInvite)}
				</Button>
				<Button
					style={{
						backgroundColor: COMAPEO_BLUE,
						color: WHITE,
						width: '100%',
						padding: '12px 20px',
					}}
					onClick={handleJoin}
				>
					{formatMessage(m.joinProject)}
				</Button>
			</div>
		</OnboardingScreenLayout>
	)
}
