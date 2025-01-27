import { useState, type ChangeEvent } from 'react'
import { useSetOwnDeviceInfo } from '@comapeo/core-react'
import { TextField } from '@mui/material'
import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { ALMOST_BLACK, RED, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingScreenLayout } from '../../components/Onboarding/OnboardingScreenLayout'
import { OnboardingTopMenu } from '../../components/Onboarding/OnboardingTopMenu'
import {
	checkForError,
	countGraphemes,
} from '../../components/Onboarding/onboardingLogic'
import { Text } from '../../components/Text'
import { DEVICE_NAME_MAX_LENGTH_GRAPHEMES } from '../../constants'
import DeviceImage from '../../images/device.png'

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
		defaultMessage: '{count}/{maxLength}',
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

const StyledImage = styled('img')({
	width: 60,
	height: 48,
})

const InputWrapper = styled('div')({
	marginTop: 12,
	marginBottom: 12,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	flexGrow: 1,
})

const StyledTextField = styled(TextField)({
	width: '100%',
	maxWidth: 400,
	backgroundColor: WHITE,
	marginTop: 12,
})

const CharacterCount = styled(Text, {
	shouldForwardProp: (prop) => prop !== 'error',
})<{ error: boolean }>(({ error }) => ({
	marginTop: 12,
	color: error ? RED : ALMOST_BLACK,
	width: '100%',
	maxWidth: 400,
	textAlign: 'right',
}))

export function DeviceNamingScreenComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()
	const [deviceName, setDeviceName] = useState('')
	const [inputError, setInputError] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const setDeviceInfoMutation = useSetOwnDeviceInfo()

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value
		const localError: boolean = checkForError(
			value.trim(),
			DEVICE_NAME_MAX_LENGTH_GRAPHEMES,
		)
		setDeviceName(value)
		if (localError !== inputError) {
			setInputError(localError)
		}
	}

	const graphemeCount = countGraphemes(deviceName.trim())

	const handleAddName = () => {
		if (checkForError(deviceName, DEVICE_NAME_MAX_LENGTH_GRAPHEMES)) {
			setInputError(true)
			return
		}
		setDeviceInfoMutation.mutate(
			{ deviceType: 'desktop', name: deviceName },
			{
				onSuccess: () => {
					navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
				},
				onError: (error) => {
					console.error('Error setting device name:', error)
					setErrorMessage(formatMessage(m.errorSavingDeviceName))
				},
			},
		)
	}

	const topMenu = (
		<OnboardingTopMenu
			currentStep={2}
			onBackPress={() => navigate({ to: '/Onboarding/DataPrivacy' })}
		/>
	)

	return (
		<OnboardingScreenLayout topMenu={topMenu}>
			<StyledImage src={DeviceImage} alt="Add Device" />
			<Text kind="title" style={{ marginTop: 32 }}>
				{formatMessage(m.title)}
			</Text>
			<Text kind="body" style={{ maxWidth: '45%', margin: '12px auto' }}>
				{formatMessage(m.description)}
			</Text>
			<div style={{ width: '100%', flexGrow: 1 }}>
				<InputWrapper>
					<StyledTextField
						placeholder={formatMessage(m.placeholder)}
						value={deviceName}
						onChange={handleChange}
						variant="outlined"
						error={inputError}
						slotProps={{
							input: {
								style: {
									padding: '5px 6px',
								},
							},
							htmlInput: {
								minLength: 1,
							},
						}}
					/>
					<CharacterCount error={inputError}>
						{formatMessage(m.characterCount, {
							count: graphemeCount,
							maxLength: DEVICE_NAME_MAX_LENGTH_GRAPHEMES,
						})}
					</CharacterCount>
				</InputWrapper>
				{errorMessage && (
					<Text style={{ color: RED, marginTop: '16px' }}>{errorMessage}</Text>
				)}
			</div>
			<div
				style={{
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
				}}
			>
				<Button
					onClick={handleAddName}
					style={{
						width: '100%',
						maxWidth: 350,
						padding: 12,
					}}
					disabled={setDeviceInfoMutation.status === 'pending' || inputError}
				>
					{setDeviceInfoMutation.status === 'pending'
						? formatMessage(m.saving)
						: formatMessage(m.addName)}
				</Button>
			</div>
		</OnboardingScreenLayout>
	)
}
