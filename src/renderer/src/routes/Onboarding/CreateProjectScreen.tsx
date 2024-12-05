import { useState, type ChangeEvent } from 'react'
import { TextField } from '@mui/material'
import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, BLUE_GREY, RED, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingScreenLayout } from '../../components/Onboarding/OnboardingScreenLayout'
import { Text } from '../../components/Text'
import {
	PROJECT_NAME_MAX_BYTES,
	PROJECT_NAME_MAX_LENGTH_GRAPHEMES,
} from '../../constants'
import ProjectImage from '../../images/add_square.png'
import ChevronUp from '../../images/chevrondown-expanded.svg'
import ChevronDown from '../../images/chevrondown.svg'
import { useCreateProject } from '../../queries/projects'

export const m = defineMessages({
	title: {
		id: 'screens.ProjectCreationScreen.title',
		defaultMessage: 'Create a Project',
	},
	enterNameLabel: {
		id: 'screens.ProjectCreationScreen.enterNameLabel',
		defaultMessage: 'Name your project',
	},
	placeholder: {
		id: 'screens.ProjectCreationScreen.placeholder',
		defaultMessage: 'Project Name',
	},
	addName: {
		id: 'screens.ProjectCreationScreen.addName',
		defaultMessage: 'Create Project',
	},
	characterCount: {
		id: 'screens.ProjectCreationScreen.characterCount',
		defaultMessage: '{count}/{maxLength}',
	},
	advancedProjectSettings: {
		id: 'screens.ProjectCreationScreen.advancedProjectSettings',
		defaultMessage: 'Advanced Project Settings',
	},
	importConfig: {
		id: 'screens.ProjectCreationScreen.importConfig',
		defaultMessage: 'Import Config',
	},
	errorSavingProjectName: {
		id: 'screens.ProjectCreationScreen.errorSavingProjectName',
		defaultMessage:
			'An error occurred while saving your project name. Please try again.',
	},
	saving: {
		id: 'screens.ProjectCreationScreen.saving',
		defaultMessage: 'Saving...',
	},
})

export const Route = createFileRoute('/Onboarding/CreateProjectScreen')({
	component: CreateJoinProjectScreenComponent,
})

const StyledImage = styled('img')({
	width: 60,
	height: 60,
})

const InputWrapper = styled('div')({
	marginTop: 24,
	marginBottom: 24,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
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

const HorizontalLine = styled('div')({
	borderBottom: `1px solid ${BLUE_GREY}`,
	margin: '20px auto 20px auto',
	width: '65%',
})

function CreateJoinProjectScreenComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()
	const [projectName, setProjectName] = useState('')
	const [error, setError] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const setProjectNameMutation = useCreateProject()

	const [advancedSettingOpen, setAdvancedSettingOpen] = useState(false)
	const [configFileName, setConfigFileName] = useState<string | null>(null)

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
		let localError = false

		if (
			graphemeCount > PROJECT_NAME_MAX_LENGTH_GRAPHEMES ||
			byteLength > PROJECT_NAME_MAX_BYTES ||
			value.trim().length === 0
		) {
			localError = true
		} else {
			setProjectName(value)
		}
		setError(localError)
	}

	const graphemeCount = countGraphemes(projectName.trim())

	const handleAddName = () => {
		if (projectName.trim().length === 0) {
			setError(true)
			return
		}
		setProjectNameMutation.mutate(projectName, {
			onSuccess: () => {
				navigate({ to: '/tab1' })
			},
			onError: (error) => {
				console.error('Error setting project name:', error)
				setErrorMessage(formatMessage(m.errorSavingProjectName))
			},
		})
	}

	function importConfigFile() {
		// Placeholder for file import logic
		setConfigFileName('myProjectConfig.comapeocat')
	}

	const icon = <StyledImage src={ProjectImage} alt="Add Project" />
	const buttons = (
		<Button
			onClick={handleAddName}
			style={{
				width: '100%',
				maxWidth: 350,
				padding: '12px 20px',
			}}
			disabled={setProjectNameMutation.isPending}
		>
			{setProjectNameMutation.isPending
				? formatMessage(m.saving)
				: formatMessage(m.addName)}
		</Button>
	)

	return (
		<OnboardingScreenLayout
			currentStep={3}
			icon={icon}
			title={formatMessage(m.title)}
			buttons={buttons}
		>
			<InputWrapper>
				<StyledTextField
					label={formatMessage(m.enterNameLabel)}
					required
					placeholder={formatMessage(m.placeholder)}
					value={projectName}
					onChange={handleChange}
					variant="outlined"
					error={error}
					sx={{
						'& .MuiFormLabel-asterisk': {
							color: 'red',
						},
					}}
					slotProps={{
						input: {
							style: {
								padding: '5px 6px',
							},
						},
						inputLabel: {
							style: { fontSize: '1.125rem' },
						},
						htmlInput: {
							minLength: 1,
						},
					}}
				/>
				<CharacterCount error={error}>
					{formatMessage(m.characterCount, {
						count: graphemeCount,
						maxLength: PROJECT_NAME_MAX_LENGTH_GRAPHEMES,
					})}
				</CharacterCount>
				{errorMessage && (
					<Text style={{ color: RED, marginTop: '16px' }}>{errorMessage}</Text>
				)}
			</InputWrapper>
			<HorizontalLine />
			<div
				style={{
					width: '100%',
					maxWidth: 400,
					margin: '0 auto',
					textAlign: 'center',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						gap: 8,
						padding: '10px 0',
						cursor: 'pointer',
					}}
					onClick={() => setAdvancedSettingOpen(!advancedSettingOpen)}
				>
					<Text bold style={{ fontSize: '1.125rem' }}>
						{formatMessage(m.advancedProjectSettings)}
					</Text>
					{advancedSettingOpen ? <ChevronDown /> : <ChevronUp />}
				</div>
				<div
					style={{
						display: advancedSettingOpen ? 'flex' : 'none',
						overflow: 'hidden',
						transition: 'height 0.3s ease',
						flexDirection: 'column',
						gap: 20,
						alignItems: 'center',
						padding: advancedSettingOpen ? 20 : 0,
					}}
				>
					<Button
						variant="outlined"
						style={{
							backgroundColor: WHITE,
							color: BLACK,
							width: '100%',
							maxWidth: 350,
							padding: '12px 20px',
						}}
						onClick={importConfigFile}
					>
						{formatMessage(m.importConfig)}
					</Button>
					{configFileName && (
						<Text style={{ textAlign: 'center' }}>{configFileName}</Text>
					)}
				</div>
			</div>
		</OnboardingScreenLayout>
	)
}
