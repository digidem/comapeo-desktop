import { useId, useMemo } from 'react'
import {
	useProjectSettings,
	useUpdateProjectSettings,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox, { type CheckboxProps } from '@mui/material/Checkbox'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Block, createFileRoute, useRouter } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import * as v from 'valibot'

import {
	BLUE_03,
	BLUE_05,
	PROJECT_COLORS,
} from '../../../../../../../shared/colors.ts'
import { DecentDialog } from '../../../../../components/decent-dialog.tsx'
import { DecentTextField } from '../../../../../components/decent-text-field.tsx'
import { DiscardEditsDialogContent } from '../../../../../components/discard-edits-dialog.tsx'
import { ErrorDialogContent } from '../../../../../components/error-dialog.tsx'
import { Icon } from '../../../../../components/icon.tsx'
import { useAppForm } from '../../../../../hooks/forms.ts'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../../lib/comapeo.ts'
import {
	PROJECT_DESCRIPTION_MAX_LENGTH_GRAPHEMES,
	PROJECT_NAME_MAX_LENGTH_GRAPHEMES,
} from '../../../../../lib/constants.ts'
import {
	createProjectColorSchema,
	createProjectDescriptionSchema,
	createProjectNameSchema,
} from '../../../../../lib/validators/project.ts'

export const Route = createFileRoute('/app/projects/$projectId/settings/info')({
	loader: async ({ context, params }) => {
		const { projectApi, queryClient } = context
		const { projectId } = params

		await queryClient.query({
			staleTime: 'static',
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

function RouteComponent() {
	const intl = useIntl()

	const router = useRouter()

	const { projectId } = Route.useParams()

	const { data: projectSettings } = useProjectSettings({ projectId })

	const setProjectSettings = useUpdateProjectSettings({ projectId })

	// TODO: We want to provide translated error messages that can be rendered directly
	// Probably not ideal do this reactively but can address later
	const onChangeSchema = useMemo(() => {
		const maxProjectNameLengthError = intl.formatMessage(
			m.maxProjectNameLengthError,
		)
		const minProjectNameLengthError = intl.formatMessage(
			m.minProjectNameLengthError,
		)

		const maxProjectDescriptionLengthError = intl.formatMessage(
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
						v.literal(PROJECT_COLORS.BLUE),
						v.literal(PROJECT_COLORS.GREEN),
						v.literal(PROJECT_COLORS.GREY),
						v.literal(PROJECT_COLORS.ORANGE),
						v.literal(PROJECT_COLORS.RED),
					]),
				),
				v.null(),
			]),
		})
	}, [intl])

	const form = useAppForm({
		defaultValues: {
			projectName: projectSettings.name,
			projectDescription: projectSettings.projectDescription || '',
			projectColor: projectSettings.projectColor || null,
		},
		validators: { onChange: onChangeSchema },
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
				router.history.back({ ignoreBlocker: true })
				return
			}

			router.navigate({
				to: '/app/projects/$projectId/settings',
				params: { projectId },
				replace: true,
				ignoreBlocker: true,
			})
		},
	})

	const formId = useId()
	const projectNameFieldBaseId = useId()
	const projectDescriptionFieldBaseId = useId()
	const projectColorLabelId = useId()

	const backIconSize = useIconSizeBasedOnTypography({
		variant: 'pageTitle',
		multiplier: 1.25,
	})

	return (
		<>
			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Stack
					component="header"
					direction="row"
					sx={{
						alignItems: 'center',
						borderBottom: `1px solid ${BLUE_05}`,
						gap: 4,
						padding: 4,
					}}
				>
					<IconButton
						aria-label={intl.formatMessage(m.goBackAccessibleLabel)}
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
						<Icon name="material-arrow-back" size={backIconSize} />
					</IconButton>

					<Typography variant="pageTitle">
						{intl.formatMessage(m.navTitle)}
					</Typography>
				</Stack>

				<Box
					sx={{
						flex: 1,
						overflow: 'auto',
						paddingBlock: 6,
						scrollbarGutter: 'stable both-edges',
					}}
				>
					<Container maxWidth="sm">
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
							<Stack direction="column" sx={{ gap: 8 }}>
								<form.AppField name="projectName">
									{(field) => {
										const inputId = `${projectNameFieldBaseId}-input`
										const errorTextId = `${projectNameFieldBaseId}-error-text`

										return (
											<DecentTextField
												fullWidth
												required
												aria-describedby={
													field.state.meta.isValid ? undefined : errorTextId
												}
												error={!field.state.meta.isValid}
												helperText={
													<Stack
														direction="row"
														sx={{
															color: field.state.meta.isValid
																? undefined
																: (theme) => theme.palette.error.main,
															justifyContent: 'space-between',
														}}
													>
														<Typography id={errorTextId} component="span">
															{field.state.meta.errors[0]?.message}
														</Typography>

														<Typography
															component="output"
															htmlFor={inputId}
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
																	intl.formatMessage(m.characterCount, {
																		count,
																		max: PROJECT_NAME_MAX_LENGTH_GRAPHEMES,
																	})
																}
															</form.Subscribe>
														</Typography>
													</Stack>
												}
												id={inputId}
												label={intl.formatMessage(m.projectNameInputLabel)}
												name={field.name}
												onBlur={field.handleBlur}
												onChange={(event) => {
													field.handleChange(event.target.value)
												}}
												value={field.state.value}
											/>
										)
									}}
								</form.AppField>

								<form.AppField name="projectDescription">
									{(field) => {
										const inputId = `${projectDescriptionFieldBaseId}-input`
										const errorTextId = `${projectDescriptionFieldBaseId}-error-text`

										return (
											<DecentTextField
												fullWidth
												multiline
												aria-describedby={
													field.state.meta.isValid ? undefined : errorTextId
												}
												enterKeyHint="enter"
												error={!field.state.meta.isValid}
												helperText={
													<Stack
														direction="row"
														sx={{
															color: field.state.meta.isValid
																? undefined
																: (theme) => theme.palette.error.main,
															justifyContent: 'space-between',
														}}
													>
														<Typography id={errorTextId} component="span">
															{field.state.meta.errors[0]?.message}
														</Typography>

														<Typography
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
																	intl.formatMessage(m.characterCount, {
																		count,
																		max: PROJECT_DESCRIPTION_MAX_LENGTH_GRAPHEMES,
																	})
																}
															</form.Subscribe>
														</Typography>
													</Stack>
												}
												id={inputId}
												label={intl.formatMessage(
													m.projectDescriptionInputLabel,
												)}
												name={field.name}
												rows={8}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) => {
													field.handleChange(event.target.value)
												}}
											/>
										)
									}}
								</form.AppField>

								<Divider variant="fullWidth" sx={{ color: BLUE_05 }} />

								<Stack direction="column" sx={{ gap: 4 }}>
									<Box>
										<Typography
											component="label"
											id={projectColorLabelId}
											variant="sectionLabel"
										>
											{intl.formatMessage(m.projectCardColorLabel)}
										</Typography>
									</Box>

									<form.AppField name="projectColor">
										{(field) => (
											<FormGroup
												row
												aria-labelledby={projectColorLabelId}
												sx={{
													flexWrap: 'nowrap',
													gap: 10,
													overflowX: 'auto',
													padding: 2,
												}}
											>
												<FormControlLabel
													name="option-orange"
													label={intl.formatMessage(m.projectColorOptionOrange)}
													checked={field.state.value === PROJECT_COLORS.ORANGE}
													onChange={(_event, checked) => {
														field.handleChange(
															checked ? PROJECT_COLORS.ORANGE : null,
														)
													}}
													labelPlacement="bottom"
													control={
														<ProjectColorCheckboxControl
															projectColor={PROJECT_COLORS.ORANGE}
														/>
													}
													sx={{ margin: 0, gap: 4 }}
												/>

												<FormControlLabel
													name="option-blue"
													label={intl.formatMessage(m.projectColorOptionBlue)}
													checked={field.state.value === PROJECT_COLORS.BLUE}
													onChange={(_event, checked) => {
														field.handleChange(
															checked ? PROJECT_COLORS.BLUE : null,
														)
													}}
													labelPlacement="bottom"
													control={
														<ProjectColorCheckboxControl
															projectColor={PROJECT_COLORS.BLUE}
														/>
													}
													sx={{ margin: 0, gap: 4 }}
												/>

												<FormControlLabel
													name="option-green"
													label={intl.formatMessage(m.projectColorOptionGreen)}
													checked={field.state.value === PROJECT_COLORS.GREEN}
													onChange={(_event, checked) => {
														field.handleChange(
															checked ? PROJECT_COLORS.GREEN : null,
														)
													}}
													labelPlacement="bottom"
													control={
														<ProjectColorCheckboxControl
															projectColor={PROJECT_COLORS.GREEN}
														/>
													}
													sx={{ margin: 0, gap: 4 }}
												/>

												<FormControlLabel
													name="option-red"
													label={intl.formatMessage(m.projectColorOptionRed)}
													checked={field.state.value === PROJECT_COLORS.RED}
													onChange={(_event, checked) => {
														field.handleChange(
															checked ? PROJECT_COLORS.RED : null,
														)
													}}
													labelPlacement="bottom"
													control={
														<ProjectColorCheckboxControl
															projectColor={PROJECT_COLORS.RED}
														/>
													}
													sx={{ margin: 0, gap: 4 }}
												/>

												<FormControlLabel
													name="option-grey"
													label={intl.formatMessage(m.projectColorOptionGrey)}
													checked={field.state.value === PROJECT_COLORS.GREY}
													onChange={(_event, checked) => {
														field.handleChange(
															checked ? PROJECT_COLORS.GREY : null,
														)
													}}
													labelPlacement="bottom"
													control={
														<ProjectColorCheckboxControl
															projectColor={PROJECT_COLORS.GREY}
														/>
													}
													sx={{ margin: 0, gap: 4 }}
												/>
											</FormGroup>
										)}
									</form.AppField>
								</Stack>
							</Stack>
						</Box>
					</Container>
				</Box>

				<Box
					sx={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'center',
						alignItems: 'center',
						padding: 6,
						borderTop: `1px solid ${BLUE_05}`,
					}}
				>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button
								aria-disabled={!canSubmit}
								form={formId}
								fullWidth
								loading={isSubmitting}
								loadingPosition="start"
								startIcon={
									<Icon name="material-check-circle-outline-rounded" />
								}
								sx={{ maxWidth: 400 }}
								type="submit"
								variant="contained"
							>
								{intl.formatMessage(m.save)}
							</Button>
						)}
					</form.Subscribe>
				</Box>
			</Stack>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					setProjectSettings.status === 'error'
						? setProjectSettings.error
						: null
				}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							setProjectSettings.reset()
						}}
					/>
				)}
			</DecentDialog>

			<form.Subscribe selector={(state) => state.isDirty}>
				{(shouldBlock) => (
					<Block
						withResolver
						// TODO: Ideally we conditionally enable this but the handled unload event does not
						// emit a state update so it won't trigger the dialog as expected.
						enableBeforeUnload={false}
						shouldBlockFn={() => {
							return shouldBlock
						}}
					>
						{({ status, proceed, reset }) => (
							<DecentDialog
								fullWidth
								maxWidth="sm"
								value={status === 'blocked' ? { proceed, reset } : null}
							>
								{(blockerActions) => (
									<DiscardEditsDialogContent
										onCancel={blockerActions.reset}
										onConfirm={blockerActions.proceed}
									/>
								)}
							</DecentDialog>
						)}
					</Block>
				)}
			</form.Subscribe>
		</>
	)
}

function ProjectColorCheckboxControl({
	projectColor,
	...checkboxProps
}: CheckboxProps & { projectColor: string }) {
	return (
		<Checkbox
			{...checkboxProps}
			disableTouchRipple
			sx={{ padding: 0 }}
			value={projectColor}
			checkedIcon={
				<Box
					sx={{
						width: 100,
						height: 100,
						background: projectColor,
						borderRadius: 2,
						outline: `4px solid ${BLUE_03}`,
					}}
				/>
			}
			icon={
				<Box
					sx={{
						width: 100,
						height: 100,
						background: projectColor,
						borderRadius: 2,
						outline: `1px solid ${BLUE_05}`,
					}}
				/>
			}
		/>
	)
}

const m = defineMessages<{
	readonly navTitle: NoMessageValues
	readonly projectNameInputLabel: NoMessageValues
	readonly projectDescriptionInputLabel: NoMessageValues
	readonly projectCardColorLabel: NoMessageValues
	readonly characterCount: {
		readonly count: MessageValue
		readonly max: MessageValue
	}
	readonly minProjectNameLengthError: NoMessageValues
	readonly maxProjectNameLengthError: NoMessageValues
	readonly maxProjectDescriptionLengthError: NoMessageValues
	readonly projectColorOptionBlue: NoMessageValues
	readonly projectColorOptionGreen: NoMessageValues
	readonly projectColorOptionGrey: NoMessageValues
	readonly projectColorOptionOrange: NoMessageValues
	readonly projectColorOptionRed: NoMessageValues
	readonly save: NoMessageValues
	readonly goBackAccessibleLabel: NoMessageValues
}>({
	navTitle: {
		id: '$1.routes.app.projects.$projectId.settings.info.navTitle',
		defaultMessage: 'Edit Info',
		description: 'Title of the project settings info page.',
	},
	projectNameInputLabel: {
		id: '$1.routes.app.projects.$projectId.settings.info.projectNameInputLabel',
		defaultMessage: 'Project Name',
		description: 'Label for the project name input.',
	},
	projectDescriptionInputLabel: {
		id: '$1.routes.app.projects.$projectId.settings.info.projectDescriptionInputLabel',
		defaultMessage: 'Short Description',
		description: 'Label for the project description input.',
	},
	projectCardColorLabel: {
		id: '$1.routes.app.projects.$projectId.settings.info.projectCardColorLabel',
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
		id: '$1.routes.app.projects.$projectId.settings.info.minProjectNameLengthError',
		defaultMessage: 'Enter a Project Name',
		description: 'Error message for project name that is too short.',
	},
	maxProjectNameLengthError: {
		id: '$1.routes.app.projects.$projectId.settings.info.maxProjectNameLengthError',
		defaultMessage: 'Too long, try a shorter name.',
		description: 'Error message for project name that is too long.',
	},
	maxProjectDescriptionLengthError: {
		id: '$1.routes.app.projects.$projectId.settings.info.maxProjectDescriptionLengthError',
		defaultMessage: 'Too long, try a shorter description.',
		description: 'Error message for project description that is too long.',
	},
	projectColorOptionBlue: {
		id: 'routes.app.projects.$projectId.settings.info.projectColorOptionBlue',
		defaultMessage: 'Blue',
		description: 'Label for blue option in project color selector.',
	},
	projectColorOptionGreen: {
		id: 'routes.app.projects.$projectId.settings.info.projectColorOptionGreen',
		defaultMessage: 'Green',
		description: 'Label for green option in project color selector.',
	},
	projectColorOptionGrey: {
		id: 'routes.app.projects.$projectId.settings.info.projectColorOptionGrey',
		defaultMessage: 'Grey',
		description: 'Label for grey option in project color selector.',
	},
	projectColorOptionOrange: {
		id: 'routes.app.projects.$projectId.settings.info.projectColorOptionOrange',
		defaultMessage: 'Orange',
		description: 'Label for orange option in project color selector.',
	},
	projectColorOptionRed: {
		id: 'routes.app.projects.$projectId.settings.info.projectColorOptionRed',
		defaultMessage: 'Red',
		description: 'Label for grey option in project color selector.',
	},
	save: {
		id: '$1.routes.app.projects.$projectId.settings.info.save',
		defaultMessage: 'Save',
		description: 'Label for save button.',
	},
	goBackAccessibleLabel: {
		id: 'routes.app.projects.$projectId.settings.info.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button.',
	},
})
