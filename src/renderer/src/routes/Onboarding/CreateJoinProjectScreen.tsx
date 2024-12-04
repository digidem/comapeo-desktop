import * as React from 'react'
import { styled } from '@mui/material/styles'
import { createFileRoute } from '@tanstack/react-router'

import { BLUE_GREY, DARK_COMAPEO_BLUE } from '../../colors'
import { OnboardingTopMenu } from '../../components/OnboardingTopMenu'
import { Text } from '../../components/Text'
import { useDeviceInfo } from '../../queries/deviceInfo'

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100%',
	backgroundColor: DARK_COMAPEO_BLUE,
})
const ContentBox = styled('div')({
	backgroundColor: 'rgba(255, 255, 255, 0.94)',
	border: `1px solid ${BLUE_GREY}`,
	borderRadius: 8,
	padding: 20,
	width: '55%',
	textAlign: 'center',
	boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.02)',
})

export const Route = createFileRoute('/Onboarding/CreateJoinProjectScreen')({
	component: CreateJoinProjectScreenComponent,
})

function CreateJoinProjectScreenComponent() {
	const { data } = useDeviceInfo()

	return (
		<Container>
			<OnboardingTopMenu currentStep={3} />
			<ContentBox>
				<Text>Device name is {data?.name}</Text>
			</ContentBox>
		</Container>
	)
}
