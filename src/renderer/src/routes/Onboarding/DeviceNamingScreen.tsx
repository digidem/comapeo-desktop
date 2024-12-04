import { useState, type ChangeEvent } from 'react'
import { TextField } from '@mui/material'
import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, BLUE_GREY, DARK_COMAPEO_BLUE, RED, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingTopMenu } from '../../components/OnboardingTopMenu'
import { Text } from '../../components/Text'
import DeviceImage from '../../images/device.png'
import { useEditDeviceInfo } from '../../queries/deviceInfo'

export const m = defineMessages({
	title: {
		id: 'screens.DeviceNamingScreen.title',
		defaultMessage: 'Name Your Device',
	},
	description: {
		id: 'screens.DeviceNamingScreen.description',
		defaultMessage:
			'A device name allows others using CoMapeo to invite you to projects.',
	},
	placeholder: {
		id: 'screens.DeviceNamingScreen.placeholder',
		defaultMessage: 'Device Name',
	},
	addName: {
		id: 'screens.DeviceNamingScreen.addName',
		defaultMessage: 'Add Name',
	},
	characterCount: {
		id: 'screens.DeviceNamingScreen.characterCount',
		defaultMessage: '{count}/60',
	},
	errorSavingDeviceName: {
		id: 'screens.DeviceNamingScreen.errorSavingDeviceName',
		defaultMessage:
			'An error occurred while saving your device name. Please try again.',
	},
	saving: {
		id: 'screens.DeviceNamingScreen.saving',
		defaultMessage: 'Saving...',
	},
})

export const Route = createFileRoute('/Onboarding/DeviceNamingScreen')({
	component: DeviceNamingScreenComponent,
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
	maxWidth: '45%',
	margin: '16px auto 0',
	textAlign: 'center',
})
const ButtonContainer = styled('div')({
	display: 'flex',
	justifyContent: 'center',
	gap: 15,
	marginTop: 63,
	padding: '0 20px',
})
const StyledImage = styled('img')({
	marginBottom: 20,
	width: 60,
	height: 60,
})
const InputWrapper = styled('div')({
	marginTop: 24,
	marginBottom: 160,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
})
const StyledTextField = styled(TextField)({
	width: '100%',
	maxWidth: '400px',
	backgroundColor: WHITE,
	marginTop: 20,
})
const CharacterCount = styled(Text, {
	shouldForwardProp: (prop) => prop !== 'error',
})<{ error: boolean }>`
	margin-top: 8px;
	color: ${({ error }) => (error ? RED : BLACK)};
	width: 100%;
	max-width: 400px;
	text-align: right;
`

export function DeviceNamingScreenComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()
	const [deviceName, setDeviceName] = useState('')
	const [error, setError] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const setDeviceNameMutation = useEditDeviceInfo()

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value
		if (value.length > 60 || value.trim().length === 0) {
			setError(true)
		} else {
			setError(false)
		}
		setDeviceName(value.slice(0, 60))
	}

	const handleAddName = () => {
		if (deviceName.trim().length === 0) {
			setError(true)
			return
		}
		setDeviceNameMutation.mutate(deviceName, {
			onSuccess: () => {
				navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
			},
			onError: (error) => {
				console.error('Error setting device name:', error)
				setErrorMessage(formatMessage(m.errorSavingDeviceName))
			},
		})
	}

	return (
		<Container>
			<OnboardingTopMenu currentStep={2} />
			<ContentBox>
				<StyledImage src={DeviceImage} alt="Device" />
				<Text kind="title">{formatMessage(m.title)}</Text>
				<BodyTextWrapper>
					<Text kind="body" style={{ marginTop: 36 }}>
						{formatMessage(m.description)}
					</Text>
				</BodyTextWrapper>
				<InputWrapper>
					<StyledTextField
						placeholder={formatMessage(m.placeholder)}
						value={deviceName}
						onChange={handleChange}
						variant="outlined"
						error={error}
						slotProps={{
							input: {
								style: {
									padding: '5px 6px',
								},
							},
							htmlInput: {
								maxLength: 60,
							},
						}}
					/>
					<CharacterCount error={error}>
						{formatMessage(m.characterCount, { count: deviceName.length })}
					</CharacterCount>
				</InputWrapper>
				{errorMessage && (
					<Text style={{ color: RED, marginTop: '16px' }}>{errorMessage}</Text>
				)}
				<ButtonContainer>
					<Button
						onClick={handleAddName}
						style={{
							width: '100%',
							maxWidth: '350px',
							borderRadius: 32,
							padding: '12px 20px',
						}}
						disabled={setDeviceNameMutation.isPending}
					>
						{setDeviceNameMutation.isPending
							? formatMessage(m.saving)
							: formatMessage(m.addName)}
					</Button>
				</ButtonContainer>
			</ContentBox>
		</Container>
	)
}
