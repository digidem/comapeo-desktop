import { useState, type ChangeEvent } from 'react'
import { TextField } from '@mui/material'
import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, BLUE_GREY, RED, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingScreenLayout } from '../../components/Onboarding/OnboardingScreenLayout'
import { OnboardingTopMenu } from '../../components/Onboarding/OnboardingTopMenu'
import {
	checkForError,
	countGraphemes,
} from '../../components/Onboarding/onboardingLogic'
import { Text } from '../../components/Text'
import { PROJECT_NAME_MAX_LENGTH_GRAPHEMES } from '../../constants'
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
	component: CreateProjectScreenComponent,
})

const StyledImage = styled('img')({
	width: 60,
	height: 60,
})

const InputWrapper = styled('div')({
	marginTop: 12,
	marginBottom: 12,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
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

function CreateProjectScreenComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()
	const [projectName, setProjectName] = useState('')
	const [error, setError] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const setProjectNameMutation = useCreateProject()

	const [advancedSettingOpen, setAdvancedSettingOpen] = useState(false)
	const [configFileName, setConfigFileName] = useState<string | null>(null)

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value
		const localError: boolean = checkForError(
			value.trim(),
			PROJECT_NAME_MAX_LENGTH_GRAPHEMES,
		)
		setProjectName(value)
		if (localError !== error) {
			setError(localError)
		}
		setError(localError)
	}

	const graphemeCount = countGraphemes(projectName.trim())

	const handleAddName = () => {
		if (checkForError(projectName, PROJECT_NAME_MAX_LENGTH_GRAPHEMES)) {
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

	const topMenu = (
		<OnboardingTopMenu
			currentStep={3}
			onBackPress={() =>
				navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
			}
		/>
	)

	return (
		<OnboardingScreenLayout topMenu={topMenu}>
			<StyledImage src={ProjectImage} alt="Add Project" />
			<Text kind="title" style={{ marginTop: 12 }}>
				{formatMessage(m.title)}
			</Text>
			<div
				style={{ flexGrow: 1, overflowY: 'auto', width: '100%', marginTop: 12 }}
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
									padding: '5px 12px',
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
				</InputWrapper>
				{errorMessage && (
					<Text style={{ color: RED, marginTop: 12 }}>{errorMessage}</Text>
				)}
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
							gap: 12,
							padding: '12px 0',
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
							flexDirection: 'column',
							gap: 12,
							alignItems: 'center',
							padding: advancedSettingOpen ? 12 : 0,
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
			</div>
			<div
				style={{
					marginTop: 12,
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
						padding: '12px 20px',
					}}
					disabled={setProjectNameMutation.isPending}
				>
					{setProjectNameMutation.isPending
						? formatMessage(m.saving)
						: formatMessage(m.addName)}
				</Button>
			</div>
		</OnboardingScreenLayout>
	)
}
