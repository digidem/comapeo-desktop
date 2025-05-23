import React from 'react'
import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, BLUE_GREY, DARK_GREY, DARK_ORANGE, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingScreenLayout } from '../../components/Onboarding/OnboardingScreenLayout'
import { OnboardingTopMenu } from '../../components/Onboarding/OnboardingTopMenu'
import { Text } from '../../components/Text'
import AddPersonImage from '../../images/AddPerson.svg'

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

const BulletList = styled('ul')({
	width: '50%',
	textAlign: 'left',
	margin: '12px auto',
	color: DARK_GREY,
	paddingLeft: 0,
})

const BulletListItem = styled('li')({
	marginBottom: 12,
})

const SecondarySubtitle = styled(Text)({
	marginTop: 12,
})

const HorizontalLine = styled('div')({
	borderBottom: `1px solid ${BLUE_GREY}`,
	margin: '60px auto 30px auto',
	width: '55%',
})

export function CreateJoinProjectScreenComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()

	const topMenu = <OnboardingTopMenu currentStep={3} />

	return (
		<OnboardingScreenLayout topMenu={topMenu}>
			<AddPersonImage color={DARK_ORANGE} style={{ width: 60, height: 48 }} />
			<Text kind="title" style={{ marginTop: 12 }}>
				{formatMessage(m.title)}
			</Text>
			<Text style={{ margin: '12px 0px', fontSize: '1.125rem' }}>
				{formatMessage(m.askToJoin)}
			</Text>
			<div style={{ width: '100%', flexGrow: 1 }}>
				<BulletList>
					<BulletListItem>
						<Text kind="body">{formatMessage(m.securelyStore)}</Text>
					</BulletListItem>
					<BulletListItem>
						<Text kind="body">{formatMessage(m.limitedToDevices)}</Text>
					</BulletListItem>
				</BulletList>
				<HorizontalLine />
				<SecondarySubtitle style={{ fontSize: '1.125rem' }}>
					{formatMessage(m.startNewProject)}
				</SecondarySubtitle>
			</div>
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
		</OnboardingScreenLayout>
	)
}
