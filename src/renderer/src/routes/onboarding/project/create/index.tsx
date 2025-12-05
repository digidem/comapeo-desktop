import { useMemo } from 'react'
import { useCreateProject } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { DARKER_ORANGE, WHITE } from '#renderer/src/colors.ts'
import { ErrorDialog } from '#renderer/src/components/error-dialog.tsx'
import { Icon } from '#renderer/src/components/icon.tsx'
import { useAppForm } from '#renderer/src/hooks/forms.ts'
import { PROJECT_NAME_MAX_LENGTH_GRAPHEMES } from '#renderer/src/lib/constants.ts'
import { createProjectNameSchema } from '#renderer/src/lib/validators/project.ts'

import { ONBOARDING_BASE_MUTATION_KEY } from '../-shared.ts'

export const Route = createFileRoute('/onboarding/project/create/')({
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()

	const { formatMessage: t } = useIntl()

	const createProject = useCreateProject()
	const createOnboardingProject = useMutation({
		mutationKey: [...ONBOARDING_BASE_MUTATION_KEY, 'project', 'create'],
		mutationFn: async (opts?: { name?: string; configPath?: string }) => {
			return createProject.mutateAsync(opts)
		},
	})

	// TODO: We want to provide translated error messages that can be rendered directly
	// Probably not ideal do this reactively but can address later
	const onChangeSchema = useMemo(() => {
		const maxLengthError = t(m.maxLengthError)
		const minLengthError = t(m.minLengthError)

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
				projectId = await createOnboardingProject.mutateAsync({
					name: projectName,
				})
			} catch (err) {
				captureException(err)
				return
			}

			router.navigate({
				to: '/onboarding/project/create/$projectId/success',
				params: { projectId },
			})
		},
	})

	const errorDialogProps =
		createOnboardingProject.status === 'error'
			? {
					open: true,

					errorMessage: createOnboardingProject.error.toString(),
					onClose: () => {
						createOnboardingProject.reset()
					},
				}
			: { open: false, onClose: () => {} }

	return (
		<>
			<Container maxWidth="sm" component={Stack} direction="column" gap={10}>
				<Stack direction="column" gap={5}>
					<Box alignSelf="center">
						<Icon
							name="material-manage-accounts-filled"
							htmlColor={DARKER_ORANGE}
							size={80}
						/>
					</Box>

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.title)}
					</Typography>
				</Stack>

				<Typography variant="h2" fontWeight={400} textAlign="center">
					{t(m.description)}
				</Typography>

				<Box
					component="form"
					id="device-name-form"
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
							<field.TextField
								id={field.name}
								required
								fullWidth
								autoFocus
								label={t(m.projectName)}
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
			</Container>

			<Box display="flex" justifyContent="center">
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<form.SubmitButton
							fullWidth
							form="device-name-form"
							variant="contained"
							type="submit"
							aria-disabled={!canSubmit || isSubmitting}
							// TODO: Maybe use spin-delay?
							loading={isSubmitting}
							loadingPosition="start"
							sx={{ maxWidth: 400 }}
							startIcon={<Icon name="material-check-circle-outline-rounded" />}
						>
							{t(m.createButton)}
						</form.SubmitButton>
					)}
				</form.Subscribe>
			</Box>

			<ErrorDialog {...errorDialogProps} />
		</>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.onboarding.project.create.index.title',
		defaultMessage: 'Start New Project',
		description: 'Page title for onboarding project creation page.',
	},
	description: {
		id: 'routes.onboarding.project.create.index.description',
		defaultMessage: 'Name your project.',
		description: 'Page description for onboarding project creation page.',
	},
	projectName: {
		id: 'routes.onboarding.project.create.index.projectName',
		defaultMessage: 'Project Name',
		description: 'Input label for onboarding project creation page.',
	},
	minLengthError: {
		id: 'routes.onboarding.project.create.index.minLengthError',
		defaultMessage: 'Enter a Project Name',
		description: 'Error message for when project name is too short.',
	},
	maxLengthError: {
		id: 'routes.onboarding.project.create.index.maxLengthError',
		defaultMessage: 'Too long, try a shorter name.',
		description: 'Error message for when project name is too long.',
	},
	createButton: {
		id: 'routes.onboarding.project.create.index.createButton',
		defaultMessage: 'Create',
		description: 'Text for button to create project.',
	},
	characterCount: {
		id: 'routes.onboarding.project.create.index.characterCount',
		defaultMessage: '{count}/{max}',
		description: 'Character count for project name input.',
	},
})
