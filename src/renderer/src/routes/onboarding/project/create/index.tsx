import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { useOnboardingCreateProject } from '../../-shared/queries'
import { DARKER_ORANGE, LIGHT_GREY, WHITE } from '../../../../colors'
import { Icon } from '../../../../components/icon'
import { useAppForm } from '../../../../hooks/forms'
import { PROJECT_NAME_MAX_LENGTH_GRAPHEMES } from '../../../../lib/constants'
import { setActiveProjectIdMutationOptions } from '../../../../lib/queries/app-settings'
import { createProjectNameSchema } from '../../../../lib/validators/project'

export const Route = createFileRoute('/onboarding/project/create/')({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const navigate = useNavigate()

	const createProject = useOnboardingCreateProject()

	const queryClient = useQueryClient()

	const setActiveProjectId = useMutation(
		setActiveProjectIdMutationOptions(queryClient),
	)

	// TODO: We want to provide translated error messages that can be rendered directly
	// Probably not ideal do this reactively but can address later
	const projectNameSchema = useMemo(() => {
		const maxLengthError = t(m.maxLengthError)
		const minLengthError = t(m.minLengthError)

		return createProjectNameSchema({
			maxBytesError: maxLengthError,
			minLengthError,
			maxLengthError,
		})
	}, [t])

	const form = useAppForm({
		defaultValues: {
			projectName: '',
		},
		validators: {
			onChange: v.object({ projectName: projectNameSchema }),
		},
		onSubmit: async ({ value }) => {
			const parsedProjectName = v.parse(projectNameSchema, value.projectName)

			const projectId = await createProject.mutateAsync({
				name: parsedProjectName,
			})

			setActiveProjectId.mutate(projectId)
			navigate({
				to: '/onboarding/project/create/$projectId/success',
				params: { projectId },
			})
		},
	})

	return (
		<Stack
			display="flex"
			useFlexGap
			direction="column"
			justifyContent="space-between"
			flex={1}
			gap={10}
			bgcolor={LIGHT_GREY}
			padding={5}
			borderRadius={2}
			overflow="auto"
		>
			<Container
				maxWidth="sm"
				component={Stack}
				direction="column"
				useFlexGap
				gap={5}
			>
				<Box alignSelf="center">
					<Icon
						name="material-symbols-new-window"
						htmlColor={DARKER_ORANGE}
						size={80}
					/>
				</Box>

				<Typography variant="h1" fontWeight={500} textAlign="center">
					{t(m.title)}
				</Typography>

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
								required
								fullWidth
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
										<Box component="span">
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
							size="large"
							disableElevation
							type="submit"
							aria-disabled={!canSubmit || isSubmitting}
							// TODO: Maybe use spin-delay?
							loading={isSubmitting}
							loadingPosition="start"
							sx={{ maxWidth: 400 }}
						>
							{t(m.createProject)}
						</form.SubmitButton>
					)}
				</form.Subscribe>
			</Box>
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.onboarding.project.create.index.title',
		defaultMessage: 'Create a Project',
	},
	description: {
		id: 'routes.onboarding.project.create.index.description',
		defaultMessage: 'Name your project.',
	},
	projectName: {
		id: 'routes.onboarding.project.create.index.projectName',
		defaultMessage: 'Project Name',
	},
	minLengthError: {
		id: 'routes.onboarding.project.create.index.minLengthError',
		defaultMessage: 'Enter a Project Name',
	},
	maxLengthError: {
		id: 'routes.onboarding.project.create.index.maxLengthError',
		defaultMessage: 'Too long, try a shorter name.',
	},
	createProject: {
		id: 'routes.onboarding.project.create.index.createProject',
		defaultMessage: 'Create Project',
	},
	characterCount: {
		id: 'routes.onboarding.project.create.index.characterCount',
		defaultMessage: '{count}/{max}',
	},
})
