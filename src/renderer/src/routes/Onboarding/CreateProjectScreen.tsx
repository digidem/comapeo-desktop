import { useState, type ChangeEvent } from 'react'
import { TextField } from '@mui/material'
import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, RED, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingScreenLayout } from '../../components/OnboardingScreenLayout'
import { Text } from '../../components/Text'
import ProjectImage from '../../images/add_square.png'
import { useCreateProject } from '../../queries/projects'

const PROJECT_NAME_MAX_LENGTH = 100
const PROJECT_NAME_MAX_BYTES = 512

export const m = defineMessages({
	title: {
		id: 'screens.ProjectCreationScreen.title',
		defaultMessage: 'Create a Project',
	},
	description: {
		id: 'screens.ProjectCreationScreen.description',
		defaultMessage: 'Name your project.',
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
	height: 48,
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
	maxWidth: 400,
	backgroundColor: WHITE,
	marginTop: 20,
})

const CharacterCount = styled(Text)<{ error: boolean }>(({ error }) => ({
	marginTop: 8,
	color: error ? RED : BLACK,
	width: '100%',
	maxWidth: 400,
	textAlign: 'right',
}))

function CreateJoinProjectScreenComponent() {
	const navigate = useNavigate()
	const { formatMessage } = useIntl()
	const [projectName, setProjectName] = useState('')
	const [error, setError] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const setProjectNameMutation = useCreateProject()

	function getGraphemeSegments(text: string): Array<string> {
		if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
			const segmenter = new Intl.Segmenter(undefined, {
				granularity: 'grapheme',
			})
			const segments = [...segmenter.segment(text)].map((s) => s.segment)
			return segments
		} else {
			return Array.from(text)
		}
	}

	function getUtf8ByteLength(text: string): number {
		return new TextEncoder().encode(text).length
	}

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value
		const segments = getGraphemeSegments(value)
		const graphemeCount = segments.length
		const byteLength = getUtf8ByteLength(value)
		let error = false

		if (
			graphemeCount > PROJECT_NAME_MAX_LENGTH ||
			byteLength > PROJECT_NAME_MAX_BYTES
		) {
			error = true
		} else {
			if (value.trim().length === 0) {
				error = true
			}
			setProjectName(value)
		}

		setError(error)
	}

	const graphemeCount = getGraphemeSegments(projectName).length

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
			bodyText={formatMessage(m.description)}
			buttons={buttons}
		>
			<InputWrapper>
				<StyledTextField
					placeholder={formatMessage(m.placeholder)}
					value={projectName}
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
							minLength: 1,
						},
					}}
				/>
				<CharacterCount error={error}>
					{formatMessage(m.characterCount, {
						count: graphemeCount,
						maxLength: PROJECT_NAME_MAX_LENGTH,
					})}
				</CharacterCount>
			</InputWrapper>
			{errorMessage && (
				<Text style={{ color: RED, marginTop: '16px' }}>{errorMessage}</Text>
			)}
		</OnboardingScreenLayout>
	)
}
