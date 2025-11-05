import { useMemo } from 'react'
import {
	useProjectSettings,
	useUpdateProjectSettings,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox, { type CheckboxProps } from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import {
	BLUE_GREY,
	COMAPEO_BLUE,
	PROJECT_BLUE,
	PROJECT_GREEN,
	PROJECT_GREY,
	PROJECT_ORANGE,
	PROJECT_RED,
} from '../../../../../colors'
import { ErrorDialog } from '../../../../../components/error-dialog'
import { Icon } from '../../../../../components/icon'
import { useAppForm } from '../../../../../hooks/forms'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../../lib/comapeo'
import {
	PROJECT_DESCRIPTION_MAX_LENGTH_GRAPHEMES,
	PROJECT_NAME_MAX_LENGTH_GRAPHEMES,
} from '../../../../../lib/constants'
import {
	createProjectColorSchema,
	createProjectDescriptionSchema,
	createProjectNameSchema,
} from '../../../../../lib/validators/project'

export const Route = createFileRoute('/app/projects/$projectId/settings/info')({
	loader: async ({ context, params }) => {
		const { projectApi, queryClient } = context
		const { projectId } = params

		// TODO: Not ideal but requires changes in @comapeo/core-react
		await queryClient.ensureQueryData({
			queryKey: [
				COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
				'projects',
				projectId,
				'project_settings',
			],
			queryFn: async () => {
				return projectApi.$getProjectSettings()
			},
		})
	},
	component: RouteComponent,
})

const FORM_ID = 'project-settings-form'

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const router = useRouter()

	const { projectId } = Route.useParams()

	const { data: projectSettings } = useProjectSettings({ projectId })

	const setProjectSettings = useUpdateProjectSettings({ projectId })

	// TODO: We want to provide translated error messages that can be rendered directly
	// Probably not ideal do this reactively but can address later
	const onChangeSchema = useMemo(() => {
		const maxProjectNameLengthError = t(m.maxProjectNameLengthError)
		const minProjectNameLengthError = t(m.minProjectNameLengthError)

		const maxProjectDescriptionLengthError = t(
			m.maxProjectDescriptionLengthError,
		)

		return v.object({
			projectName: createProjectNameSchema({
				maxBytesError: maxProjectNameLengthError,
				minLengthError: minProjectNameLengthError,
				maxLengthError: maxProjectNameLengthError,
			}),
			projectDescription: createProjectDescriptionSchema({
				maxBytesError: maxProjectDescriptionLengthError,
				maxLengthError: maxProjectDescriptionLengthError,
			}),
			projectColor: v.union([
				v.pipe(
					createProjectColorSchema(),
					v.union([
						v.literal(PROJECT_BLUE),
						v.literal(PROJECT_GREEN),
						v.literal(PROJECT_GREY),
						v.literal(PROJECT_ORANGE),
						v.literal(PROJECT_RED),
					]),
				),
				v.null(),
			]),
		})
	}, [t])

	const form = useAppForm({
		defaultValues: {
			projectName: projectSettings.name,
			projectDescription: projectSettings.projectDescription || '',
			projectColor: projectSettings.projectColor || null,
		},
		validators: {
			onChange: onChangeSchema,
		},
		onSubmit: async ({ value }) => {
			const { projectName, projectDescription, projectColor } = v.parse(
				onChangeSchema,
				value,
			)

			// TODO: Catch error and report to Sentry
			await setProjectSettings.mutateAsync({
				name: projectName,
				projectDescription:
					projectDescription.length > 0 ? projectDescription : undefined,
				projectColor: projectColor === null ? undefined : projectColor,
			})

			if (router.history.canGoBack()) {
				router.history.back()
				return
			}

			router.navigate({
				to: '/app/projects/$projectId/settings',
				params: { projectId },
				replace: true,
			})
		},
	})

	return (
		<>
			<Stack direction="column" flex={1} overflow="auto">
				<Stack
					direction="row"
					alignItems="center"
					component="nav"
					gap={4}
					padding={4}
					borderBottom={`1px solid ${BLUE_GREY}`}
				>
					<IconButton
						aria-label={t(m.goBackAccessibleLabel)}
						onClick={() => {
							if (router.history.canGoBack()) {
								router.history.back()
								return
							}

							router.navigate({
								to: '/app/projects/$projectId/settings',
								params: { projectId },
								replace: true,
							})
						}}
					>
						<Icon name="material-arrow-back" size={30} />
					</IconButton>

					<Typography variant="h1" fontWeight={500}>
						{t(m.navTitle)}
					</Typography>
				</Stack>

				<Stack
					direction="column"
					flex={1}
					justifyContent="space-between"
					overflow="auto"
				>
					<Box paddingBlock={6}>
						<Box
							component="form"
							id={FORM_ID}
							noValidate
							autoComplete="off"
							onSubmit={(event) => {
								event.preventDefault()
								if (form.state.isSubmitting) return
								form.handleSubmit()
							}}
						>
							<Stack direction="column" gap={10}>
								<Box paddingInline={6}>
									<form.AppField name="projectName">
										{(field) => (
											<field.TextField
												required
												fullWidth
												label={t(m.projectNameInputLabel)}
												value={field.state.value}
												error={!field.state.meta.isValid}
												name={field.name}
												onChange={(event) => {
													field.handleChange(event.target.value)
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
																	state.values.projectName
																		? v._getGraphemeCount(
																				state.values.projectName,
																			)
																		: 0
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

								<Box paddingInline={6}>
									<form.AppField name="projectDescription">
										{(field) => (
											<field.TextField
												fullWidth
												multiline
												rows={3}
												enterKeyHint="done"
												label={t(m.projectDescriptionInputLabel)}
												value={field.state.value}
												error={!field.state.meta.isValid}
												name={field.name}
												onChange={(event) => {
													field.handleChange(event.target.value)
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
																	state.values.projectDescription
																		? v._getGraphemeCount(
																				state.values.projectDescription,
																			)
																		: 0
																}
															>
																{(count) =>
																	t(m.characterCount, {
																		count,
																		max: PROJECT_DESCRIPTION_MAX_LENGTH_GRAPHEMES,
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

								<FormControl>
									<Stack direction="column" gap={4}>
										<Box paddingInline={6}>
											<FormLabel id="project-color-selector-label">
												{t(m.projectCardColorLabel)}
											</FormLabel>
										</Box>

										<form.AppField name="projectColor">
											{(field) => (
												<FormGroup
													row
													aria-labelledby="project-color-selector-label"
													sx={{
														flexWrap: 'nowrap',
														gap: 10,
														overflowX: 'auto',
														paddingInline: 6,
														paddingBlock: 2,
													}}
												>
													<FormControlLabel
														name="option-orange"
														label={t(m.projectColorOptionOrange)}
														checked={field.state.value === PROJECT_ORANGE}
														onChange={(_event, checked) => {
															field.handleChange(
																checked ? PROJECT_ORANGE : null,
															)
														}}
														labelPlacement="bottom"
														control={
															<ProjectColorCheckboxControl
																projectColor={PROJECT_ORANGE}
															/>
														}
														sx={{ margin: 0, gap: 4 }}
													/>

													<FormControlLabel
														name="option-blue"
														label={t(m.projectColorOptionBlue)}
														checked={field.state.value === PROJECT_BLUE}
														onChange={(_event, checked) => {
															field.handleChange(checked ? PROJECT_BLUE : null)
														}}
														labelPlacement="bottom"
														control={
															<ProjectColorCheckboxControl
																projectColor={PROJECT_BLUE}
															/>
														}
														sx={{ margin: 0, gap: 4 }}
													/>

													<FormControlLabel
														name="option-green"
														label={t(m.projectColorOptionGreen)}
														checked={field.state.value === PROJECT_GREEN}
														onChange={(_event, checked) => {
															field.handleChange(checked ? PROJECT_GREEN : null)
														}}
														labelPlacement="bottom"
														control={
															<ProjectColorCheckboxControl
																projectColor={PROJECT_GREEN}
															/>
														}
														sx={{ margin: 0, gap: 4 }}
													/>

													<FormControlLabel
														name="option-red"
														label={t(m.projectColorOptionRed)}
														checked={field.state.value === PROJECT_RED}
														onChange={(_event, checked) => {
															field.handleChange(checked ? PROJECT_RED : null)
														}}
														labelPlacement="bottom"
														control={
															<ProjectColorCheckboxControl
																projectColor={PROJECT_RED}
															/>
														}
														sx={{ margin: 0, gap: 4 }}
													/>

													<FormControlLabel
														name="option-grey"
														label={t(m.projectColorOptionGrey)}
														checked={field.state.value === PROJECT_GREY}
														onChange={(_event, checked) => {
															field.handleChange(checked ? PROJECT_GREY : null)
														}}
														labelPlacement="bottom"
														control={
															<ProjectColorCheckboxControl
																projectColor={PROJECT_GREY}
															/>
														}
														sx={{ margin: 0, gap: 4 }}
													/>
												</FormGroup>
											)}
										</form.AppField>
									</Stack>
								</FormControl>
							</Stack>
						</Box>
					</Box>

					<Stack
						direction="column"
						gap={4}
						paddingX={6}
						paddingBottom={6}
						position="sticky"
						bottom={0}
						alignItems="center"
						zIndex={1}
					>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<>
									<Button
										type="button"
										variant="outlined"
										fullWidth
										aria-disabled={isSubmitting}
										onClick={() => {
											if (isSubmitting) return

											if (router.history.canGoBack()) {
												router.history.back()
												return
											}

											router.navigate({
												to: '/app/projects/$projectId/settings',
												params: { projectId },
												replace: true,
											})
										}}
										sx={{ maxWidth: 400 }}
									>
										{t(m.cancel)}
									</Button>

									<form.SubmitButton
										type="submit"
										form={FORM_ID}
										fullWidth
										variant="contained"
										loading={isSubmitting}
										loadingPosition="start"
										aria-disabled={!canSubmit}
										sx={{ maxWidth: 400 }}
									>
										{t(m.save)}
									</form.SubmitButton>
								</>
							)}
						</form.Subscribe>
					</Stack>
				</Stack>
			</Stack>

			<ErrorDialog
				open={setProjectSettings.status === 'error'}
				errorMessage={setProjectSettings.error?.toString()}
				onClose={() => {
					setProjectSettings.reset()
				}}
			/>
		</>
	)
}

function ProjectColorCheckboxControl({
	projectColor,
	...checkboxProps
}: CheckboxProps & {
	projectColor: string
}) {
	return (
		<Checkbox
			{...checkboxProps}
			disableTouchRipple
			sx={{ padding: 0 }}
			value={projectColor}
			checkedIcon={
				<Box
					width={100}
					height={100}
					bgcolor={projectColor}
					borderRadius={2}
					sx={{ outline: `8px solid ${COMAPEO_BLUE}` }}
				/>
			}
			icon={
				<Box
					width={100}
					height={100}
					bgcolor={projectColor}
					borderRadius={2}
					sx={{ outline: `1px solid ${BLUE_GREY}` }}
				/>
			}
		/>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId_.settings.info.navTitle',
		defaultMessage: 'Edit Info',
		description: 'Title of the project settings info page.',
	},
	projectNameInputLabel: {
		id: 'routes.app.projects.$projectId_.settings.info.projectNameInputLabel',
		defaultMessage: 'Project Name',
		description: 'Label for the project name input.',
	},
	projectDescriptionInputLabel: {
		id: 'routes.app.projects.$projectId_.settings.info.projectDescriptionInputLabel',
		defaultMessage: 'Project Description',
		description: 'Label for the project description input.',
	},
	projectCardColorLabel: {
		id: 'routes.app.projects.$projectId_.settings.info.projectCardColorLabel',
		defaultMessage: 'Project Card Color',
		description: 'Label for the project card color selector.',
	},
	characterCount: {
		id: 'routes.app.settings.device-name.characterCount',
		defaultMessage: '{count}/{max}',
		description:
			'Displays number of characters in input out of the maximum allowed characters.',
	},
	minProjectNameLengthError: {
		id: 'routes.app.projects.$projectId_.settings.info.minProjectNameLengthError',
		defaultMessage: 'Enter a Project Name',
		description: 'Error message for project name that is too short.',
	},
	maxProjectNameLengthError: {
		id: 'routes.app.projects.$projectId_.settings.info.maxProjectNameLengthError',
		defaultMessage: 'Too long, try a shorter name.',
		description: 'Error message for project name that is too long.',
	},
	maxProjectDescriptionLengthError: {
		id: 'routes.app.projects.$projectId_.settings.info.maxProjectDescriptionLengthError',
		defaultMessage: 'Too long, try a shorter description.',
		description: 'Error message for project description that is too long.',
	},
	projectColorOptionBlue: {
		id: 'routes.app.projects.$projectId_.settings.info.projectColorOptionBlue',
		defaultMessage: 'Blue',
		description: 'Label for blue option in project color selector.',
	},
	projectColorOptionGreen: {
		id: 'routes.app.projects.$projectId_.settings.info.projectColorOptionGreen',
		defaultMessage: 'Green',
		description: 'Label for green option in project color selector.',
	},
	projectColorOptionGrey: {
		id: 'routes.app.projects.$projectId_.settings.info.projectColorOptionGrey',
		defaultMessage: 'Grey',
		description: 'Label for grey option in project color selector.',
	},
	projectColorOptionOrange: {
		id: 'routes.app.projects.$projectId_.settings.info.projectColorOptionOrange',
		defaultMessage: 'Orange',
		description: 'Label for orange option in project color selector.',
	},
	projectColorOptionRed: {
		id: 'routes.app.projects.$projectId_.settings.info.projectColorOptionRed',
		defaultMessage: 'Red',
		description: 'Label for grey option in project color selector.',
	},
	save: {
		id: 'routes.app.projects.$projectId_.settings.info.save',
		defaultMessage: 'Save',
		description: 'Label for save button.',
	},
	cancel: {
		id: 'routes.app.projects.$projectId_.settings.info.cancel',
		defaultMessage: 'Cancel',
		description: 'Label for cancel button.',
	},
	goBackAccessibleLabel: {
		id: 'routes.app.projects.$projectId_.settings.info.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button.',
	},
})
