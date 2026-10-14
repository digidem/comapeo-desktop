import { useId, useMemo, useState } from 'react'
import { useCreateProject } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation } from '@tanstack/react-query'
import { draw } from 'radashi'
import {
	defineMessages,
	useIntl,
	type MessageTag,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import { useSpinDelay } from 'spin-delay'
import * as v from 'valibot'

import {
	ORANGE_00,
	PROJECT_COLORS,
	WHITE_00,
} from '../../../../shared/colors.ts'
import { DecentDialog } from '../../components/decent-dialog.tsx'
import { DecentTextField } from '../../components/decent-text-field.tsx'
import { ErrorDialogContent } from '../../components/error-dialog.tsx'
import { Icon } from '../../components/icon.tsx'
import { Bold } from '../../components/intl-rich-text.tsx'
import { useAppForm } from '../../hooks/forms.ts'
import { useIconSizeBasedOnTypography } from '../../hooks/icon.ts'
import { PROJECT_NAME_MAX_LENGTH_GRAPHEMES } from '../../lib/constants.ts'
import { setAppUsageMetricsMutationOptions } from '../../lib/queries/app-settings.ts'
import { createProjectNameSchema } from '../../lib/validators/project.ts'

export function StartProjectDialogContent({
	onProjectCreated,
	onBack,
}: {
	onProjectCreated: (projectId: string) => void
	onBack: () => void
}) {
	const intl = useIntl()

	const componentId = useId()
	const formId = `${componentId}-project-name-form`
	const labelId = `${componentId}-label`

	const createProject = useCreateProject()

	// TODO: We want to provide translated error messages that can be rendered directly
	// Probably not ideal do this reactively but can address later
	const onChangeSchema = useMemo(() => {
		const maxLengthError = intl.formatMessage(m.projectNameMaxLengthError)
		const minLengthError = intl.formatMessage(m.projectNameMinLengthError)

		return v.object({
			projectName: createProjectNameSchema({
				maxBytesError: maxLengthError,
				minLengthError,
				maxLengthError,
			}),
		})
	}, [intl])

	const form = useAppForm({
		defaultValues: { projectName: '' },
		validators: { onChange: onChangeSchema },
		onSubmit: async ({ value }) => {
			const { projectName } = v.parse(onChangeSchema, value)

			let projectId: string
			try {
				projectId = await createProject.mutateAsync({
					name: projectName,
					projectColor: draw([
						PROJECT_COLORS.BLUE,
						PROJECT_COLORS.GREEN,
						PROJECT_COLORS.GREY,
						PROJECT_COLORS.ORANGE,
						PROJECT_COLORS.RED,
					]),
				})
			} catch (err) {
				captureException(err)
				return
			}

			onProjectCreated(projectId)
		},
	})

	const heroIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	return (
		<Stack direction="column" sx={{ flex: 1 }}>
			<Box sx={{ padding: 4 }}>
				<Button
					variant="text"
					startIcon={<Icon name="material-arrow-back" />}
					aria-disabled={!onBack}
					onClick={onBack}
				>
					{intl.formatMessage(m.projectActionDialogGoBack)}
				</Button>
			</Box>

			<Divider />

			<Stack
				direction="column"
				sx={{ flex: 1, padding: 6, gap: 10, overflow: 'auto' }}
			>
				<Container
					component={Stack}
					maxWidth="sm"
					direction="column"
					sx={{ flex: 1, gap: 10 }}
				>
					<Stack direction="column" sx={{ alignItems: 'center' }}>
						<Box>
							<Icon
								name="material-manage-accounts-filled"
								htmlColor={ORANGE_00}
								size={heroIconSize}
							/>
						</Box>

						<Typography
							component="h1"
							variant="heroHeader"
							sx={{ textAlign: 'center' }}
						>
							{intl.formatMessage(m.startProjectDialogTitle)}
						</Typography>
					</Stack>

					<Typography variant="heroSubheading" sx={{ textAlign: 'center' }}>
						{intl.formatMessage(m.startProjectDialogDescription)}
					</Typography>

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
							{(field) => {
								const inputId = `${componentId}-input`
								const errorTextId = `${componentId}-error-text`

								return (
									<DecentTextField
										aria-describedby={
											field.state.meta.isValid ? undefined : errorTextId
										}
										error={!field.state.meta.isValid}
										fullWidth
										helperText={
											<Stack
												component="span"
												direction="row"
												sx={{
													color: (theme) =>
														field.state.meta.isValid
															? theme.palette.text.secondary
															: theme.palette.error.main,
													justifyContent: 'space-between',
												}}
											>
												<Typography
													id={errorTextId}
													color="inherit"
													component="span"
													variant="detailCopy"
												>
													{field.state.meta.errors[0]?.message}
												</Typography>

												<Typography
													color="inherit"
													component="output"
													htmlFor={inputId}
													name="character-count"
													variant="detailCopy"
												>
													<form.Subscribe
														selector={(state) =>
															v._getGraphemeCount(state.values.projectName)
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

										onBlur={field.handleBlur}
										onChange={(event) => {
											field.handleChange(event.target.value)
										}}
										required
										slotProps={{
											input: {
												'aria-labelledby': labelId,
												style: { background: WHITE_00 },
											},
										}}
										value={field.state.value}
									/>
								)
							}}
						</form.AppField>
					</Box>
				</Container>

				<Box sx={{ display: 'flex', justifyContent: 'center' }}>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button
								aria-disabled={!canSubmit || isSubmitting}
								form={formId}
								fullWidth
								// TODO: Maybe use spin-delay?
								loading={isSubmitting}
								loadingPosition="start"
								startIcon={
									<Icon name="material-check-circle-outline-rounded" />
								}
								type="submit"
								variant="contained"
							>
								{intl.formatMessage(m.createProjectButton)}
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
	const intl = useIntl()

	const iconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	return (
		<Stack direction="column">
			<Stack direction="column" sx={{ gap: 10, flex: 1, padding: 20 }}>
				<Stack direction="column" sx={{ gap: 4, alignItems: 'center' }}>
					<Box>
						<Icon
							name="material-symbols-waving-hand"
							htmlColor={ORANGE_00}
							size={iconSize}
						/>
					</Box>

					<Typography
						component="h1"
						variant="heroHeader"
						sx={{ textAlign: 'center' }}
					>
						{intl.formatMessage(m.leftProjectDialogTitle, {
							name: projectName || '',
						})}
					</Typography>
				</Stack>
			</Stack>

			<Box
				sx={{
					bottom: 0,
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'center',
					left: 0,
					padding: 6,
					position: 'sticky',
					right: 0,
					top: 0,
				}}
			>
				<Button
					fullWidth
					variant="outlined"
					onClick={() => {
						onClose()
					}}
				>
					{intl.formatMessage(m.leftProjectDialogCloseButton)}
				</Button>
			</Box>
		</Stack>
	)
}

export function AppUsageConsentDialogContent({
	deviceName,
	onClose,
}: {
	deviceName?: string
	onClose: () => void
}) {
	const [contentToDisplay, setContentToDisplay] = useState<
		'interstitial' | 'success'
	>('interstitial')

	if (contentToDisplay === 'interstitial') {
		return (
			<AppUsageInterstitial
				onClose={onClose}
				onProceed={() => {
					setContentToDisplay('success')
				}}
			/>
		)
	}

	return <AppUsageSuccess deviceName={deviceName} onClose={onClose} />
}

function AppUsageInterstitial({
	onClose,
	onProceed,
}: {
	onClose: () => void
	onProceed: () => void
}) {
	const intl = useIntl()

	const setAppUsageMetrics = useMutation(setAppUsageMetricsMutationOptions())

	const isActionVisiblyPending = useSpinDelay(
		setAppUsageMetrics.status === 'pending',
		{ delay: 100 },
	)

	const heroIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	const listItemIconSize = useIconSizeBasedOnTypography({
		variant: 'bodyCopy',
		multiplier: 1,
	})

	return (
		<Stack direction="column">
			<Stack direction="column" sx={{ gap: 10, flex: 1, padding: 20 }}>
				<Stack direction="column" sx={{ gap: 6, alignItems: 'center' }}>
					<Stack direction="column" sx={{ alignItems: 'center' }}>
						<Box>
							<Icon
								name="noun-project-checklist"
								htmlColor={ORANGE_00}
								size={heroIconSize}
							/>
						</Box>

						<Typography
							component="h1"
							variant="heroHeader"
							sx={{ textAlign: 'center', textWrap: 'balance' }}
						>
							{intl.formatMessage(m.appUsageConsentInterstitialTitle)}
						</Typography>
					</Stack>

					<Typography
						variant="heroSubheading"
						sx={{ textAlign: 'center', textWrap: 'balance' }}
					>
						{intl.formatMessage(m.appUsageConsentInterstitialDescription)}
					</Typography>

					<Stack
						component={List}
						direction="column"
						sx={{
							color: (theme) => theme.palette.text.secondary,
							gap: 4,
							paddingInline: 10,
						}}
					>
						<ListItem sx={{ gap: 2, alignItems: 'stretch' }}>
							<Icon
								name="openmoji-puzzle-piece"
								size={listItemIconSize}
								sx={{ alignSelf: 'baseline' }}
							/>

							{intl.formatMessage(
								m.appUsageConsentInterstitialDetailsIdNumbers,
							)}
						</ListItem>

						<ListItem sx={{ gap: 2, alignItems: 'stretch' }}>
							<Icon
								name="openmoji-cross-mark"
								size={listItemIconSize}
								sx={{ alignSelf: 'baseline' }}
							/>

							{intl.formatMessage(
								m.appUsageConsentInterstitialDetailsIpAddresses,
							)}
						</ListItem>

						<ListItem sx={{ gap: 2, alignItems: 'stretch' }}>
							<Icon
								name="openmoji-switch"
								size={listItemIconSize}
								sx={{ alignSelf: 'baseline' }}
							/>

							{intl.formatMessage(
								m.appUsageConsentInterstitialDetailsTurnOffAnytime,
							)}
						</ListItem>
					</Stack>
				</Stack>
			</Stack>

			<Stack
				direction="row"
				sx={{ flexWrap: 'wrap', gap: 4, justifyContent: 'center', padding: 6 }}
			>
				<Button
					fullWidth
					variant="outlined"
					aria-disabled={setAppUsageMetrics.status === 'pending'}
					onClick={() => {
						if (setAppUsageMetrics.status === 'pending') {
							return
						}

						setAppUsageMetrics.mutate({
							status: 'disabled',
							shouldBumpAskCount: true,
						})
						onClose()
					}}
				>
					{intl.formatMessage(m.appUsageConsentInterstitialDenyButton)}
				</Button>

				<Button
					fullWidth
					variant="contained"
					aria-disabled={setAppUsageMetrics.status === 'pending'}
					loading={isActionVisiblyPending}
					loadingPosition="start"
					onClick={() => {
						if (setAppUsageMetrics.status === 'pending') {
							return
						}

						setAppUsageMetrics.mutate(
							{ status: 'enabled', shouldBumpAskCount: true },
							{
								onSuccess: () => {
									onProceed()
								},
							},
						)
					}}
				>
					{intl.formatMessage(m.appUsageConsentInterstitialAllowButton)}
				</Button>
			</Stack>
		</Stack>
	)
}

function AppUsageSuccess({
	deviceName,
	onClose,
}: {
	deviceName: string | undefined
	onClose: () => void
}) {
	const intl = useIntl()

	const heroIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	return (
		<Stack direction="column">
			<Stack direction="column" sx={{ flex: 1, gap: 10, padding: 20 }}>
				<Stack direction="column" sx={{ gap: 20 }}>
					<Stack direction="column" sx={{ alignItems: 'center', gap: 6 }}>
						<Icon
							name="material-check-circle-rounded"
							color="success"
							size={heroIconSize}
						/>

						<Typography
							variant="heroHeader"
							sx={{ textAlign: 'center', textWrap: 'balance' }}
						>
							{intl.formatMessage(m.appUsageConsentSuccessTitle)}
						</Typography>

						<Typography
							variant="heroSubheading"
							sx={{ textAlign: 'center', textWrap: 'balance' }}
						>
							{deviceName
								? intl.formatMessage(m.appUsageConsentSuccessDescription, {
										b: Bold,
										deviceName,
									})
								: intl.formatMessage(
										m.appUsageConsentSuccessDescriptionNoDeviceName,
									)}
						</Typography>
					</Stack>

					<Typography sx={{ textAlign: 'center', textWrap: 'balance' }}>
						{intl.formatMessage(m.appUsageConsentSuccessDetailsChangeSetting)}
					</Typography>
				</Stack>
			</Stack>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'center',
					padding: 6,
				}}
			>
				<Button
					fullWidth
					variant="outlined"
					onClick={() => {
						onClose()
					}}
				>
					{intl.formatMessage(m.appUsageConsentSuccessCloseButton)}
				</Button>
			</Box>
		</Stack>
	)
}

const m = defineMessages<{
	readonly projectActionDialogGoBack: NoMessageValues
	readonly startProjectDialogTitle: NoMessageValues
	readonly startProjectDialogDescription: NoMessageValues
	readonly projectNameInputLabel: NoMessageValues
	readonly projectNameMinLengthError: NoMessageValues
	readonly projectNameMaxLengthError: NoMessageValues
	readonly createProjectButton: NoMessageValues
	readonly characterCount: {
		readonly count: MessageValue
		readonly max: MessageValue
	}
	readonly leftProjectDialogTitle: { readonly name: MessageValue }
	readonly leftProjectDialogCloseButton: NoMessageValues
	readonly appUsageConsentInterstitialTitle: NoMessageValues
	readonly appUsageConsentInterstitialDescription: NoMessageValues
	readonly appUsageConsentInterstitialDetailsIdNumbers: NoMessageValues
	readonly appUsageConsentInterstitialDetailsIpAddresses: NoMessageValues
	readonly appUsageConsentInterstitialDetailsTurnOffAnytime: NoMessageValues
	readonly appUsageConsentInterstitialDenyButton: NoMessageValues
	readonly appUsageConsentInterstitialAllowButton: NoMessageValues
	readonly appUsageConsentSuccessTitle: NoMessageValues
	readonly appUsageConsentSuccessDescription: {
		readonly b: MessageTag
		readonly deviceName: MessageValue
	}
	readonly appUsageConsentSuccessDescriptionNoDeviceName: NoMessageValues
	readonly appUsageConsentSuccessDetailsChangeSetting: NoMessageValues
	readonly appUsageConsentSuccessCloseButton: NoMessageValues
}>({
	projectActionDialogGoBack: {
		id: '$1.routes.app.index.projectActionDialogGoBack',
		defaultMessage: 'Go back',
		description: 'Text for button to close project join/create dialog.',
	},
	startProjectDialogTitle: {
		id: '$1.routes.app.index.startProjectDialogTitle',
		defaultMessage: 'Start New Project',
		description: 'Description of dialog shown for starting a project.',
	},
	startProjectDialogDescription: {
		id: '$1.routes.app.index.startProjectDialogDescription',
		defaultMessage: 'Name your project.',
		description: 'Description of dialog shown for starting a project.',
	},
	projectNameInputLabel: {
		id: '$1.routes.app.index.projectNameInputLabel',
		defaultMessage: 'Project Name',
		description: 'Input label for input in start project dialog.',
	},
	projectNameMinLengthError: {
		id: '$1.routes.app.index.projectNameMinLengthError',
		defaultMessage: 'Enter a Project Name',
		description: 'Error message for when project name is too short.',
	},
	projectNameMaxLengthError: {
		id: '$1.routes.app.index.projectNameMaxLengthError',
		defaultMessage: 'Too long, try a shorter name.',
		description: 'Error message for when project name is too long.',
	},
	createProjectButton: {
		id: '$1.routes.app.index.createProjectButton',
		defaultMessage: 'Create',
		description: 'Text for button to create project.',
	},
	characterCount: {
		id: 'routes.app.index.characterCount',
		defaultMessage: '{count}/{max}',
		description: 'Character count for project name input.',
	},
	leftProjectDialogTitle: {
		id: '$1.routes.app.index.leftProjectDialogTitle',
		defaultMessage: 'This device has left the project {name}.',
		description: 'Title text for left project dialog.',
	},
	leftProjectDialogCloseButton: {
		id: '$1.routes.app.index.leftProjectDialogCloseButton',
		defaultMessage: 'Close',
		description: 'Text for button to close left project dialog.',
	},
	appUsageConsentInterstitialTitle: {
		id: '$1.routes.app.index.appUsageConsentInterstitialTitle',
		defaultMessage: 'Help improve your experience.',
		description:
			'Title text for interstitial state of app usage consent dialog.',
	},
	appUsageConsentInterstitialDescription: {
		id: '$1.routes.app.index.appUsageConsentInterstitialDescription',
		defaultMessage:
			'Share how you use CoMapeo with Awana Digital — no information you share can be used to track you.',
		description:
			'Description text for interstitial state of app usage consent dialog.',
	},
	appUsageConsentInterstitialDetailsIdNumbers: {
		id: '$1.routes.app.index.appUsageConsentInterstitialDetailsIdNumbers',
		defaultMessage:
			'ID numbers are scrambled randomly and changed every month.',
		description:
			'Text describing how IDs used for app usage metrics are used and generated.',
	},
	appUsageConsentInterstitialDetailsIpAddresses: {
		id: '$1.routes.app.index.appUsageConsentInterstitialDetailsIpAddresses',
		defaultMessage: 'CoMapeo never stores IP addresses.',
		description: 'Text describing how IP addresses are never stored.',
	},
	appUsageConsentInterstitialDetailsTurnOffAnytime: {
		id: '$1.routes.app.index.appUsageConsentInterstitialDetailsTurnOffAnytime',
		defaultMessage: 'Turn off any time.',
		description:
			'Text describing how app usage metrics can be turned off at any time.',
	},
	appUsageConsentInterstitialDenyButton: {
		id: '$1.routes.app.index.appUsageConsentInterstitialDenyButton',
		defaultMessage: 'No, not now',
		description: 'Text for button to deny consent for app usage metrics.',
	},
	appUsageConsentInterstitialAllowButton: {
		id: '$1.routes.app.index.appUsageConsentInterstitialAllowButton',
		defaultMessage: 'Yes, count me in',
		description: 'Text for button to allow consent for app usage metrics.',
	},
	appUsageConsentSuccessTitle: {
		id: '$1.routes.app.index.appUsageConsentSuccessTitle',
		defaultMessage: 'Success!',
		description: 'Title text for success state of app usage consent dialog.',
	},
	appUsageConsentSuccessDescription: {
		id: '$1.routes.app.index.appUsageConsentSuccessDescription',
		defaultMessage:
			'<b>{deviceName}</b> is now sharing how you use CoMapeo with Awana Digital.',
		description:
			'Description text for success state of app usage consent dialog.',
	},
	appUsageConsentSuccessDescriptionNoDeviceName: {
		id: '$1.routes.app.index.appUsageConsentSuccessDescriptionNoDeviceName',
		defaultMessage:
			'This device is now sharing how you use CoMapeo with Awana Digital.',
		description:
			'Description text for success state of app usage consent dialog when device name not present (edge case).',
	},
	appUsageConsentSuccessDetailsChangeSetting: {
		id: '$1.routes.app.index.appUsageConsentSuccessDetailsChangeSetting',
		defaultMessage:
			'Change this anytime by navigating to Data & Privacy in CoMapeo Settings.',
		description:
			'Description text for success state of app usage consent dialog.',
	},
	appUsageConsentSuccessCloseButton: {
		id: '$1.routes.app.index.appUsageConsentSuccessCloseButton',
		defaultMessage: 'Done',
		description: 'Text for button to close app usage consent dialog.',
	},
})
