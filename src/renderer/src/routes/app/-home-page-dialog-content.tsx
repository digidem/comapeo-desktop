import { useId, useMemo } from 'react'
import { useCreateProject } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useStore } from '@tanstack/react-form'
import { draw } from 'radashi'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import {
	DARKER_ORANGE,
	PROJECT_BLUE,
	PROJECT_GREEN,
	PROJECT_GREY,
	PROJECT_ORANGE,
	PROJECT_RED,
	WHITE,
} from '../../colors.ts'
import { DecentDialog } from '../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../components/error-dialog.tsx'
import { Icon } from '../../components/icon.tsx'
import { useAppForm } from '../../hooks/forms.ts'
import { PROJECT_NAME_MAX_LENGTH_GRAPHEMES } from '../../lib/constants.ts'
import { createProjectNameSchema } from '../../lib/validators/project.ts'

export function JoinProjectDialogContent({ onBack }: { onBack: () => void }) {
	const { formatMessage: t } = useIntl()

	return (
		<Stack direction="column" flex={1}>
			<Box padding={2}>
				<Button
					variant="text"
					startIcon={<Icon name="material-arrow-back" />}
					aria-disabled={!onBack}
					onClick={onBack}
				>
					{t(m.projectActionDialogGoBack)}
				</Button>
			</Box>

			<Divider variant="fullWidth" />

			<Stack
				direction="column"
				gap={10}
				justifyContent="center"
				textAlign="center"
				flex={1}
				padding={6}
				overflow="auto"
			>
				<Box>
					<Box>
						<Icon
							name="material-people-filled"
							htmlColor={DARKER_ORANGE}
							size={120}
						/>
					</Box>

					<Typography variant="h1" fontWeight={500}>
						{t(m.joinProjectDialogTitle)}
					</Typography>
				</Box>

				<Typography>{t(m.joinProjectDialogDescription)}</Typography>
			</Stack>
		</Stack>
	)
}

export function StartProjectDialogContent({
	onProjectCreated,
	onBack,
}: {
	onProjectCreated: (projectId: string) => void
	onBack: () => void
}) {
	const { formatMessage: t } = useIntl()

	const formId = `project-name-${useId()}`

	const createProject = useCreateProject()

	// TODO: We want to provide translated error messages that can be rendered directly
	// Probably not ideal do this reactively but can address later
	const onChangeSchema = useMemo(() => {
		const maxLengthError = t(m.projectNameMaxLengthError)
		const minLengthError = t(m.projectNameMinLengthError)

		return v.object({
			projectName: createProjectNameSchema({
				maxBytesError: maxLengthError,
				minLengthError,
				maxLengthError,
			}),
		})
	}, [t])

	const form = useAppForm({
		defaultValues: {
			projectName: '',
		},
		validators: {
			onChange: onChangeSchema,
		},
		onSubmit: async ({ value }) => {
			const { projectName } = v.parse(onChangeSchema, value)

			let projectId: string
			try {
				projectId = await createProject.mutateAsync({
					name: projectName,
					projectColor: draw([
						PROJECT_BLUE,
						PROJECT_GREEN,
						PROJECT_GREY,
						PROJECT_ORANGE,
						PROJECT_RED,
					]),
				})
			} catch (err) {
				captureException(err)
				return
			}

			onProjectCreated(projectId)
		},
	})

	const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

	return (
		<Stack direction="column" flex={1}>
			<Box padding={2}>
				<Button
					variant="text"
					startIcon={<Icon name="material-arrow-back" />}
					aria-disabled={!onBack}
					onClick={onBack}
				>
					{t(m.projectActionDialogGoBack)}
				</Button>
			</Box>

			<Divider variant="fullWidth" />

			<Stack direction="column" flex={1} padding={6} gap={10} overflow="auto">
				<Stack
					direction="column"
					gap={10}
					justifyContent="center"
					textAlign="center"
					flex={1}
				>
					<Box>
						<Box>
							<Icon
								name="material-manage-accounts-filled"
								htmlColor={DARKER_ORANGE}
								size={120}
							/>
						</Box>

						<Typography variant="h1" fontWeight={500}>
							{t(m.startProjectDialogTitle)}
						</Typography>
					</Box>

					<Typography>{t(m.startProjectDialogDescription)}</Typography>

					<Box
						component="form"
						id={formId}
						noValidate
						autoComplete="off"
						onSubmit={(event) => {
							event.preventDefault()
							if (form.state.isSubmitting) return
							form.handleSubmit()
						}}
					>
						<form.AppField name="projectName">
							{(field) => (
								<TextField
									id={field.name}
									required
									fullWidth
									autoFocus
									label={t(m.projectNameInputLabel)}
									value={field.state.value}
									error={!field.state.meta.isValid}
									onChange={(event) => {
										field.handleChange(event.target.value)
									}}
									slotProps={{
										input: {
											style: {
												backgroundColor: WHITE,
											},
										},
									}}
									sx={{ maxWidth: (theme) => theme.breakpoints.values.sm }}
									onBlur={field.handleBlur}
									helperText={
										<Stack
											component="span"
											direction="row"
											justifyContent="space-between"
										>
											<Box component="span">
												{field.state.meta.errors[0]?.message}
											</Box>
											<Box
												component="output"
												htmlFor={field.name}
												name="character-count"
											>
												<form.Subscribe
													selector={(state) =>
														v._getGraphemeCount(state.values.projectName)
													}
												>
													{(count) =>
														t(m.characterCount, {
															count,
															max: PROJECT_NAME_MAX_LENGTH_GRAPHEMES,
														})
													}
												</form.Subscribe>
											</Box>
										</Stack>
									}
								/>
							)}
						</form.AppField>
					</Box>
				</Stack>

				<Box display="flex" justifyContent="center">
					<form.Subscribe selector={(state) => [state.canSubmit]}>
						{([canSubmit]) => (
							<Button
								fullWidth
								form={formId}
								variant="contained"
								type="submit"
								aria-disabled={!canSubmit || isSubmitting}
								// TODO: Maybe use spin-delay?
								loading={isSubmitting}
								loadingPosition="start"
								sx={{ maxWidth: 400 }}
								startIcon={
									<Icon name="material-check-circle-outline-rounded" />
								}
							>
								{t(m.createProjectButton)}
							</Button>
						)}
					</form.Subscribe>
				</Box>
			</Stack>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					createProject.status === 'error' ? createProject.error : undefined
				}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							createProject.reset()
						}}
					/>
				)}
			</DecentDialog>
		</Stack>
	)
}

export function LeftProjectDialogContent({
	onClose,
	projectName,
}: {
	onClose: () => void
	projectName?: string
}) {
	const { formatMessage: t } = useIntl()

	return (
		<Stack direction="column">
			<Stack direction="column" gap={10} flex={1} padding={20}>
				<Stack direction="column" gap={4} alignItems="center">
					<Box>
						<Icon
							name="material-symbols-waving-hand"
							htmlColor={DARKER_ORANGE}
							size="96px"
						/>
					</Box>

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.leftProjectDialogTitle, { name: projectName || '' })}
					</Typography>
				</Stack>
			</Stack>

			<Box
				position="sticky"
				right={0}
				left={0}
				top={0}
				bottom={0}
				display="flex"
				flexDirection="row"
				justifyContent="center"
				padding={6}
			>
				<Button
					fullWidth
					variant="outlined"
					onClick={() => {
						onClose()
					}}
					sx={{ maxWidth: 400 }}
				>
					{t(m.leftProjectDialogCloseButton)}
				</Button>
			</Box>
		</Stack>
	)
}

const m = defineMessages({
	projectActionDialogGoBack: {
		id: 'routes.app.index.projectActionDialogGoBack',
		defaultMessage: 'Go back',
		description: 'Text for button to close project join/create dialog.',
	},
	joinProjectDialogTitle: {
		id: 'routes.app.index.joinProjectDialogTitle',
		defaultMessage: 'Join a Project',
		description: 'Title of dialog shown for joining a project.',
	},
	joinProjectDialogDescription: {
		id: 'routes.app.index.joinProjectDialogDescription',
		defaultMessage:
			'Coordinate with your team to receive a project invitation.',
		description: 'Description of dialog shown for joining a project.',
	},
	startProjectDialogTitle: {
		id: 'routes.app.index.startProjectDialogTitle',
		defaultMessage: 'Start New Project',
		description: 'Description of dialog shown for starting a project.',
	},
	startProjectDialogDescription: {
		id: 'routes.app.index.startProjectDialogDescription',
		defaultMessage: 'Name your project.',
		description: 'Description of dialog shown for starting a project.',
	},
	projectNameInputLabel: {
		id: 'routes.app.index.projectNameInputLabel',
		defaultMessage: 'Project Name',
		description: 'Input label for input in start project dialog.',
	},
	projectNameMinLengthError: {
		id: 'routes.app.index.projectNameMinLengthError',
		defaultMessage: 'Enter a Project Name',
		description: 'Error message for when project name is too short.',
	},
	projectNameMaxLengthError: {
		id: 'routes.app.index.projectNameMaxLengthError',
		defaultMessage: 'Too long, try a shorter name.',
		description: 'Error message for when project name is too long.',
	},
	createProjectButton: {
		id: 'routes.app.index.createProjectButton',
		defaultMessage: 'Create',
		description: 'Text for button to create project.',
	},
	characterCount: {
		id: 'routes.app.index.characterCount',
		defaultMessage: '{count}/{max}',
		description: 'Character count for project name input.',
	},
	leftProjectDialogTitle: {
		id: 'routes.app.index.leftProjectDialogTitle',
		defaultMessage: 'This device has left the project {name}.',
		description: 'Title text for left project dialog.',
	},
	leftProjectDialogCloseButton: {
		id: 'routes.app.index.leftProjectDialogCloseButton',
		defaultMessage: 'Close',
		description: 'Text for button to close left project dialog.',
	},
})
