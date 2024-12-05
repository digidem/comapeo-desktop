import { useState, type ChangeEvent } from 'react'
import { TextField } from '@mui/material'
import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, RED, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingScreenLayout } from '../../components/Onboarding/OnboardingScreenLayout'
import { Text } from '../../components/Text'
import {
	DEVICE_NAME_MAX_BYTES,
	DEVICE_NAME_MAX_LENGTH_GRAPHEMES,
} from '../../constants'
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
	marginTop: 24,
	marginBottom: 160,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	flexGrow: 1,
})

const StyledTextField = styled(TextField)({
	width: '100%',
	maxWidth: 400,
	backgroundColor: WHITE,
	marginTop: 20,
})

const CharacterCount = styled(Text, {
	shouldForwardProp: (prop) => prop !== 'error',
})<{ error: boolean }>(({ error }) => ({
	marginTop: 8,
	color: error ? RED : BLACK,
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
	const setDeviceNameMutation = useEditDeviceInfo()

	function countGraphemes(text: string): number {
		const segmenter = new Intl.Segmenter(undefined, {
			granularity: 'grapheme',
		})
		let result = 0
		for (const _ of segmenter.segment(text)) result++
		return result
	}

	function getUtf8ByteLength(text: string): number {
		return new TextEncoder().encode(text).length
	}

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value
		const graphemeCount = countGraphemes(value.trim())
		const byteLength = getUtf8ByteLength(value.trim())
		let error = false

		if (
			graphemeCount > DEVICE_NAME_MAX_LENGTH_GRAPHEMES ||
			byteLength > DEVICE_NAME_MAX_BYTES
		) {
			error = true
		} else {
			if (value.trim().length === 0) {
				error = true
			}
			setDeviceName(value)
		}

		setInputError(error)
	}

	const graphemeCount = countGraphemes(deviceName.trim())

	const handleAddName = () => {
		if (deviceName.trim().length === 0) {
			setInputError(true)
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

	const icon = <StyledImage src={DeviceImage} alt="Add Device" />
	const buttons = (
		<Button
			onClick={handleAddName}
			style={{
				width: '100%',
				maxWidth: 350,
				padding: '12px 20px',
			}}
			disabled={setDeviceNameMutation.isPending || inputError}
		>
			{setDeviceNameMutation.isPending
				? formatMessage(m.saving)
				: formatMessage(m.addName)}
		</Button>
	)

	return (
		<OnboardingScreenLayout
			currentStep={2}
			icon={icon}
			title={formatMessage(m.title)}
			bodyText={formatMessage(m.description)}
			buttons={buttons}
		>
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
		</OnboardingScreenLayout>
	)
}
