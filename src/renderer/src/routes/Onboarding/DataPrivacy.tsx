import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import {
	BLACK,
	BLUE_GREY,
	DARK_COMAPEO_BLUE,
	DARK_GREY,
	WHITE,
} from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingTopMenu } from '../../components/OnboardingTopMenu'
import { Text } from '../../components/Text'
import LockedIcon from '../../images/LockedWithKey.svg'

export const m = defineMessages({
	title: {
		id: 'screens.DataPrivacy.title',
		defaultMessage: 'Review Data & Privacy',
	},
	description: {
		id: 'screens.DataPrivacy.description',
		defaultMessage:
			'CoMapeo allows teams to map offline without needing internet servers.',
	},
	dataPrivacyStays: {
		id: 'screens.DataPrivacy.stays',
		defaultMessage: 'Your data stays on your devices.',
	},
	dataPrivacyEncrypted: {
		id: 'screens.DataPrivacy.encrypted',
		defaultMessage: 'All data stays fully encrypted',
	},
	dataPrivacyManageAndControl: {
		id: 'screens.DataPrivacy.manageAndControl',
		defaultMessage: 'Easily manage and control sharing and collaboration.',
	},
	dataPrivacyDiagnostic: {
		id: 'screens.DataPrivacy.diagnostic',
		defaultMessage:
			'Private by default — diagnostic information is made fully anonymous and you can opt-out any time.',
	},
	learnMore: {
		id: 'screens.DataPrivacy.learnMore',
		defaultMessage: 'Learn More',
	},
	next: {
		id: 'screens.DataPrivacy.next',
		defaultMessage: 'Next',
	},
})

export const Route = createFileRoute('/Onboarding/DataPrivacy')({
	component: DataPrivacyComponent,
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
	backgroundColor: 'rgba(255, 255, 255, 0.94)',
	border: `1px solid ${BLUE_GREY}`,
	borderRadius: 8,
	padding: 20,
	width: '55%',
	textAlign: 'center',
	boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.02)',
})

const BodyTextWrapper = styled('div')({
	maxWidth: '40%',
	margin: '16px auto 0',
	textAlign: 'center',
})
const ButtonContainer = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	gap: 15,
	marginTop: 63,
	padding: '0 20px',
})
const StyledIcon = styled(LockedIcon)({
	marginBottom: '16px',
	width: 40,
	height: 50,
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
export function DataPrivacyComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()

	return (
		<Container>
			<OnboardingTopMenu currentStep={1} />
			<ContentBox>
				<StyledIcon />
				<Text kind="title">{formatMessage(m.title)}</Text>
				<BodyTextWrapper>
					<Text kind="body" style={{ marginTop: '16px' }}>
						{formatMessage(m.description)}
					</Text>
				</BodyTextWrapper>
				<BulletList>
					<BulletListItem>
						<Text kind="body">{formatMessage(m.dataPrivacyStays)}</Text>
					</BulletListItem>
					<BulletListItem>
						<Text kind="body">{formatMessage(m.dataPrivacyEncrypted)}</Text>
					</BulletListItem>
					<BulletListItem>
						<Text kind="body">
							{formatMessage(m.dataPrivacyManageAndControl)}
						</Text>
					</BulletListItem>
					<BulletListItem>
						<Text kind="body">{formatMessage(m.dataPrivacyDiagnostic)}</Text>
					</BulletListItem>
				</BulletList>
				<ButtonContainer>
					<Button
						onClick={() => navigate({ to: '/Onboarding/PrivacyPolicyScreen' })}
						variant="outlined"
						style={{
							color: BLACK,
							backgroundColor: WHITE,
							width: '100%',
						}}
					>
						{formatMessage(m.learnMore)}
					</Button>
					<Button
						onClick={() => navigate({ to: '/Onboarding/NextStep' })}
						style={{
							width: '100%',
						}}
					>
						{formatMessage(m.next)}
					</Button>
				</ButtonContainer>
			</ContentBox>
		</Container>
	)
}
