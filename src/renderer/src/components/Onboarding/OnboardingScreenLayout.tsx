import React, { type ReactNode } from 'react'
import { styled } from '@mui/material/styles'

import { BLUE_GREY, DARK_COMAPEO_BLUE } from '../../colors'
import { Text } from '../Text'
import { OnboardingTopMenu } from './OnboardingTopMenu'

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	minHeight: '100vh',
	backgroundColor: DARK_COMAPEO_BLUE,
})

const ContentWrapper = styled('div')({
	flexGrow: 1,
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	alignItems: 'center',
})

const ContentBox = styled('div')({
	backgroundColor: 'rgba(255, 255, 255, 0.94)',
	border: `1px solid ${BLUE_GREY}`,
	borderRadius: 8,
	padding: 20,
	maxWidth: 800,
	width: '55%',
	textAlign: 'center',
	boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.02)',
	boxSizing: 'border-box',
	flexGrow: 0,
	flexShrink: 0,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
})

const Content = styled('div')({
	width: '100%',
	flexGrow: 1,
})

const BodyTextWrapper = styled('div')({
	maxWidth: '45%',
	margin: '16px auto 0',
	textAlign: 'center',
})

const ButtonContainer = styled('div')<{ isSingleButton: boolean }>(
	({ isSingleButton }) => ({
		display: 'flex',
		justifyContent: isSingleButton ? 'center' : 'space-between',
		gap: 15,
		marginTop: 63,
		padding: '0 20px',
		width: '100%',
	}),
)

interface OnboardingScreenLayoutProps {
	currentStep: number
	icon?: ReactNode
	title: ReactNode
	bodyText?: ReactNode
	children?: ReactNode
	buttons?: ReactNode
}

export function OnboardingScreenLayout(props: OnboardingScreenLayoutProps) {
	const { currentStep, icon, title, bodyText, children, buttons } = props
	const isSingleButton = React.Children.count(buttons) === 1

	return (
		<Container>
			<OnboardingTopMenu currentStep={currentStep} />
			<ContentWrapper>
				<ContentBox>
					{icon && <div style={{ margin: '32px 0px' }}>{icon}</div>}
					<Text kind="title">{title}</Text>
					{bodyText && (
						<BodyTextWrapper>
							<Text style={{ margin: '32px 0px', fontSize: '1.125rem' }}>
								{bodyText}
							</Text>
						</BodyTextWrapper>
					)}
					<Content>{children}</Content>
					{buttons && (
						<ButtonContainer isSingleButton={isSingleButton}>
							{buttons}
						</ButtonContainer>
					)}
				</ContentBox>
			</ContentWrapper>
		</Container>
	)
}
