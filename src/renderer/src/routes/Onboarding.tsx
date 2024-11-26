import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { CORNFLOWER_BLUE, DARK_COMAPEO_BLUE, WHITE } from '../colors'
import { Button } from '../components/Button'
import { Text } from '../components/Text'
import CoMapeoTextAsSVG from '../images/CoMapeoText.svg'
import TopoBackground from '../images/TopoLogo.svg'
import Calling from '../images/calling.png'
import LockedWithKey from '../images/closed_lock_with_key.png'
import RaisedFistMediumSkinTone from '../images/raised_fist_medium_skin_tone.png'
import WorldMap from '../images/world_map.png'

export const Route = createFileRoute('/Onboarding')({
	component: OnboardingComponent,
})

const m = defineMessages({
	getStarted: {
		id: 'screens.IntroToCoMapeo.getStarted',
		defaultMessage: 'Get Started',
	},
	mapWorldTogether: {
		id: 'screens.IntroToCoMapeo.viewAndManage',
		defaultMessage: 'View and manage observations in CoMapeo Mobile Projects.',
	},
	mapAnywhere: {
		id: 'screens.IntroToCoMapeo.mapAnywhere',
		defaultMessage: 'Map anywhere and everywhere',
	},
	collaborate: {
		id: 'screens.IntroToCoMapeo.collaborate',
		defaultMessage: 'Collaborate with others',
	},
	ownData: {
		id: 'screens.IntroToCoMapeo.ownData',
		defaultMessage: 'Own and control your data',
	},
	designedFor: {
		id: 'screens.IntroToCoMapeo.designedFor',
		defaultMessage:
			'Designed with and for Indigenous peoples & frontline communities',
	},
})

const Container = styled('div')({
	position: 'relative',
	backgroundColor: DARK_COMAPEO_BLUE,
	width: '100%',
	height: '100vh',
	overflow: 'hidden',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
})

const Background = styled(TopoBackground)({
	position: 'absolute',
	width: '100%',
	height: '100%',
	opacity: 0.5,
	zIndex: 0,
})

const ContentWrapper = styled('div')({
	display: 'grid',
	gridTemplateColumns: '1fr 2fr 2fr 1fr',
	columnGap: '32px',
	alignItems: 'center',
	width: '100%',
	height: '60%',
	zIndex: 1,
})

const LeftSection = styled('div')({
	gridColumn: 2,
	paddingLeft: '32px',
	maxHeight: '189px',
})

const RightSection = styled('div')({
	gridColumn: 3,
	maxWidth: '400px',
	paddingLeft: '32px',
})

const LogoSection = styled('div')({
	display: 'flex',
	flexDirection: 'column',
})

const DesktopText = styled(Text)(() => ({
	color: CORNFLOWER_BLUE,
	fontSize: 64,
	fontWeight: 500,
	width: '300px',
	marginTop: -20,
}))

const MainText = styled(Text)(() => ({
	color: WHITE,
	fontSize: '16px',
	fontWeight: 500,
	marginTop: 12,
	maxWidth: '300px',
}))

const TextBox = styled('div')({
	width: '100%',
	maxWidth: '300px',
	padding: '32px 24px',
	borderWidth: 1,
	borderColor: WHITE,
	borderStyle: 'solid',
	borderRadius: '4px',
	backgroundColor: 'rgba(0, 0, 0, 0.5)',
	display: 'flex',
	flexDirection: 'column',
	gap: '16px',
})

const TextItem = styled('div')({
	display: 'flex',
	alignItems: 'center',
	gap: 16,
})

const StyledText = styled(Text)(({ theme }) => ({
	color: WHITE,
	fontSize: theme.typography.caption.fontSize,
}))

function OnboardingComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()

	return (
		<Container>
			<Background />
			<ContentWrapper>
				<LeftSection>
					<LogoSection>
						<CoMapeoTextAsSVG width={300} height={70} />
						<DesktopText>Desktop</DesktopText>
					</LogoSection>
					<MainText>{formatMessage(m.mapWorldTogether)}</MainText>
				</LeftSection>

				<RightSection>
					<TextBox>
						<TextItem>
							<img src={WorldMap} alt="World Map" width={24} height={24} />
							<StyledText>{formatMessage(m.mapAnywhere)}</StyledText>
						</TextItem>
						<TextItem>
							<img src={Calling} width={24} height={24} />
							<StyledText>{formatMessage(m.collaborate)}</StyledText>
						</TextItem>
						<TextItem>
							<img src={LockedWithKey} width={24} height={24} />
							<StyledText>{formatMessage(m.ownData)}</StyledText>
						</TextItem>
						<TextItem>
							<img src={RaisedFistMediumSkinTone} width={24} height={24} />
							<StyledText>{formatMessage(m.designedFor)}</StyledText>
						</TextItem>
					</TextBox>
				</RightSection>
			</ContentWrapper>

			<Button
				onClick={() => navigate({ to: '/Onboarding/DataPrivacy' })}
				style={{ width: '300px' }}
			>
				{formatMessage(m.getStarted)}
			</Button>
		</Container>
	)
}

export default OnboardingComponent
