import React from 'react'
import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, BLUE_GREY, DARK_GREY, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingScreenLayout } from '../../components/Onboarding/OnboardingScreenLayout'
import { Text } from '../../components/Text'
import AddPersonImage from '../../images/add_person.png'

export const m = defineMessages({
	title: {
		id: 'screens.CreateJoinProjectScreen.title',
		defaultMessage: 'Join a Project',
	},
	askToJoin: {
		id: 'screens.CreateJoinProjectScreen.askToJoin',
		defaultMessage: 'Ask a monitoring coordinator to join their Project.',
	},
	securelyStore: {
		id: 'screens.CreateJoinProjectScreen.securelyStore',
		defaultMessage:
			'Projects help teams securely store and share their territory monitoring data and observations.',
	},
	limitedToDevices: {
		id: 'screens.CreateJoinProjectScreen.limitedToDevices',
		defaultMessage:
			'Sharing observations and data are limited to devices within each Project.',
	},
	startNewProject: {
		id: 'screens.CreateJoinProjectScreen.startNewProject',
		defaultMessage: 'Starting a new territory monitoring project?',
	},
	createProject: {
		id: 'screens.CreateJoinProjectScreen.createProject',
		defaultMessage: 'Create a Project',
	},
})

export const Route = createFileRoute('/Onboarding/CreateJoinProjectScreen')({
	component: CreateJoinProjectScreenComponent,
})

const StyledImage = styled('img')({
	width: 60,
	height: 48,
})

const BulletList = styled('ul')({
	width: '50%',
	textAlign: 'left',
	margin: '16px auto',
	color: DARK_GREY,
	paddingLeft: 0,
})

const BulletListItem = styled('li')({
	marginBottom: 8,
})

const SecondarySubtitle = styled(Text)({
	marginTop: 40,
})

const HorizontalLine = styled('div')({
	borderBottom: `1px solid ${BLUE_GREY}`,
	margin: '60px auto 30px auto',
	width: '55%',
})

export function CreateJoinProjectScreenComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()

	const icon = <StyledImage src={AddPersonImage} alt="Add Person" />
	const buttons = (
		<Button
			variant="outlined"
			style={{
				backgroundColor: WHITE,
				color: BLACK,
				width: '100%',
				maxWidth: 350,
				padding: '12px 20px',
			}}
			onClick={() => navigate({ to: '/Onboarding/CreateProjectScreen' })}
		>
			{' '}
			{formatMessage(m.createProject)}
		</Button>
	)

	const bulletPoints = (
		<BulletList>
			<BulletListItem>
				<Text kind="body">{formatMessage(m.securelyStore)}</Text>
			</BulletListItem>
			<BulletListItem>
				<Text kind="body">{formatMessage(m.limitedToDevices)}</Text>
			</BulletListItem>
		</BulletList>
	)

	return (
		<OnboardingScreenLayout
			currentStep={3}
			icon={icon}
			title={formatMessage(m.title)}
			buttons={buttons}
			bodyText={formatMessage(m.askToJoin)}
		>
			{bulletPoints}
			<HorizontalLine />
			<SecondarySubtitle style={{ fontSize: '1.125rem' }}>
				{formatMessage(m.startNewProject)}
			</SecondarySubtitle>
		</OnboardingScreenLayout>
	)
}
