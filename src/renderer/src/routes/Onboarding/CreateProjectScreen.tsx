import { useState, type ChangeEvent } from 'react'
import { useCreateProject } from '@comapeo/core-react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	TextField,
} from '@mui/material'
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
import { useActiveProjectIdStoreActions } from '../../contexts/ActiveProjectIdProvider'
import { useSelectProjectConfigFile } from '../../hooks/mutations/file-system'
import ProjectImage from '../../images/add_square.png'

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
	createProject: {
		id: 'screens.ProjectCreationScreen.createProject',
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
	errorSavingProject: {
		id: 'screens.ProjectCreationScreen.errorSavingProject',
		defaultMessage:
			'An error occurred while saving your project. Please try again.',
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

const FileNameDisplay = styled(Text)({
	textAlign: 'center',
	marginTop: 12,
	maxWidth: '100%',
	overflow: 'hidden',
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
	display: 'inline-block',
})

function CreateProjectScreenComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()

	const [projectName, setProjectName] = useState('')
	const [hasNameError, setHasNameError] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [configPath, setConfigPath] = useState<string | undefined>(undefined)
	const [fileName, setFileName] = useState<string | undefined>()

	const createProjectMutation = useCreateProject()
	const selectConfigFile = useSelectProjectConfigFile()
	const { setActiveProjectId } = useActiveProjectIdStoreActions()

	function handleImportConfig() {
		selectConfigFile.mutate(undefined, {
			onSuccess: (file) => {
				if (file) {
					setConfigPath(file.path)
					setFileName(file.name)
				}
			},
			onError: (err) => {
				console.error('Error selecting file', err)
			},
		})
	}

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value
		setProjectName(value)

		const localError: boolean = checkForError(
			value.trim(),
			PROJECT_NAME_MAX_LENGTH_GRAPHEMES,
		)
		setHasNameError(localError)
	}

	const graphemeCount = countGraphemes(projectName.trim())

	const handleCreateProject = () => {
		if (checkForError(projectName, PROJECT_NAME_MAX_LENGTH_GRAPHEMES)) {
			setHasNameError(true)
			return
		}

		createProjectMutation.mutate(
			{ name: projectName.trim(), configPath },
			{
				onSuccess: (projectId) => {
					setActiveProjectId(projectId)
					navigate({ to: '/tab1' })
				},
				onError: (error) => {
					console.error('Error saving project:', error)
					setErrorMessage(formatMessage(m.errorSavingProject))
				},
			},
		)
	}

	const backPressHandler =
		createProjectMutation.status === 'pending'
			? undefined
			: () => navigate({ to: '/Onboarding/CreateJoinProjectScreen' })

	const topMenu = (
		<OnboardingTopMenu currentStep={3} onBackPress={backPressHandler} />
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
						error={hasNameError}
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
					<CharacterCount error={hasNameError}>
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
					<Accordion
						sx={{
							boxShadow: 'none',
							background: 'transparent',
							textAlign: 'left',
						}}
					>
						<AccordionSummary
							expandIcon={<ExpandMoreIcon />}
							aria-controls="advanced-settings-content"
							id="advanced-settings-header"
							sx={{ padding: '0', margin: '0', minHeight: 'inherit' }}
						>
							<Text bold style={{ fontSize: '1.125rem' }}>
								{formatMessage(m.advancedProjectSettings)}
							</Text>
						</AccordionSummary>
						<AccordionDetails>
							<Button
								variant="outlined"
								style={{
									backgroundColor: WHITE,
									color: BLACK,
									width: '100%',
									maxWidth: 350,
									padding: '12px 20px',
								}}
								onClick={handleImportConfig}
							>
								{formatMessage(m.importConfig)}
							</Button>
							{fileName && (
								<FileNameDisplay data-testid="filename-display">
									{fileName}
								</FileNameDisplay>
							)}
						</AccordionDetails>
					</Accordion>
				</div>
			</div>
			<Button
				onClick={handleCreateProject}
				style={{
					width: '100%',
					maxWidth: 350,
					padding: '12px 20px',
				}}
				disabled={createProjectMutation.status === 'pending'}
			>
				{formatMessage(
					createProjectMutation.status === 'pending'
						? m.saving
						: m.createProject,
				)}
			</Button>
		</OnboardingScreenLayout>
	)
}
