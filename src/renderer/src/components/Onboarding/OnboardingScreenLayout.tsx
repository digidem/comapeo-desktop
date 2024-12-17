import React, { type ReactNode } from 'react'
import { styled } from '@mui/material/styles'

import { BLUE_GREY, DARK_COMAPEO_BLUE } from '../../colors'

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
	position: 'relative',
	backgroundColor: 'rgba(255, 255, 255, 0.94)',
	border: `1px solid ${BLUE_GREY}`,
	borderRadius: 8,
	padding: 20,
	maxWidth: 800,
	width: '55%',
	textAlign: 'center',
	boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.02)',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	minHeight: 700,
	overflow: 'hidden',
})

interface OnboardingScreenLayoutProps {
	topMenu?: ReactNode
	children?: ReactNode
}

export function OnboardingScreenLayout({
	topMenu,
	children,
}: OnboardingScreenLayoutProps) {
	return (
		<Container>
			{topMenu}
			<ContentWrapper>
				<ContentBox>{children}</ContentBox>
			</ContentWrapper>
		</Container>
	)
}
