import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, DARK_GREY, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingScreenLayout } from '../../components/Onboarding/OnboardingScreenLayout'
import { OnboardingTopMenu } from '../../components/Onboarding/OnboardingTopMenu'
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
		defaultMessage: 'All data stays fully encrypted.',
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

const StyledIcon = styled(LockedIcon)({
	width: 40,
	height: 50,
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
export function DataPrivacyComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()

	function onBackPress() {
		navigate({ to: '/Onboarding' })
	}

	const topMenu = (
		<OnboardingTopMenu currentStep={1} onBackPress={onBackPress} />
	)

	const bulletPoints = (
		<BulletList>
			<BulletListItem>
				<Text kind="body">{formatMessage(m.dataPrivacyStays)}</Text>
			</BulletListItem>
			<BulletListItem>
				<Text kind="body">{formatMessage(m.dataPrivacyEncrypted)}</Text>
			</BulletListItem>
			<BulletListItem>
				<Text kind="body">{formatMessage(m.dataPrivacyManageAndControl)}</Text>
			</BulletListItem>
			<BulletListItem>
				<Text kind="body">{formatMessage(m.dataPrivacyDiagnostic)}</Text>
			</BulletListItem>
		</BulletList>
	)

	return (
		<OnboardingScreenLayout topMenu={topMenu}>
			<StyledIcon />
			<Text kind="title" style={{ marginTop: 32 }}>
				{formatMessage(m.title)}
			</Text>
			<Text kind="body" style={{ maxWidth: '45%', margin: '12px auto' }}>
				{formatMessage(m.description)}
			</Text>
			<div style={{ width: '100%', flexGrow: 1 }}>{bulletPoints}</div>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					gap: 12,
					width: '100%',
				}}
			>
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
					onClick={() => navigate({ to: '/Onboarding/DeviceNamingScreen' })}
					style={{ width: '100%', padding: '12px 20px' }}
				>
					{formatMessage(m.next)}
				</Button>
			</div>
		</OnboardingScreenLayout>
	)
}
