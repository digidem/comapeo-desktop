import { useId, useMemo } from 'react'
import { useOwnDeviceInfo, useSetOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import * as v from 'valibot'

import { BLACK_03, ORANGE_00, WHITE_00 } from '../../../../shared/colors.ts'
import { DecentDialog } from '../../components/decent-dialog.tsx'
import { DecentTextField } from '../../components/decent-text-field.tsx'
import { ErrorDialogContent } from '../../components/error-dialog.tsx'
import { Icon } from '../../components/icon.tsx'
import { useAppForm } from '../../hooks/forms.ts'
import { useIconSizeBasedOnTypography } from '../../hooks/icon.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../lib/comapeo.ts'
import { DEVICE_NAME_MAX_LENGTH_GRAPHEMES } from '../../lib/constants.ts'
import { setOnboardedAtMutationOptions } from '../../lib/queries/user.ts'
import { createDeviceNameSchema } from '../../lib/validators/device.ts'

export const Route = createFileRoute('/onboarding/device-name')({
	loader: async ({ context }) => {
		const { clientApi, queryClient } = context

		await queryClient.query({
			staleTime: 'static',
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
			queryFn: async () => {
				return clientApi.getDeviceInfo()
			},
		})
	},
	staticData: { onboardingStepNumber: 2 },
	component: RouteComponent,
})

function RouteComponent() {
	const intl = useIntl()

	const router = useRouter()

	const { data: deviceInfo } = useOwnDeviceInfo()
	const setOwnDeviceInfo = useSetOwnDeviceInfo()

	const setOnboardedAt = useMutation(setOnboardedAtMutationOptions())

	// TODO: We want to provide translated error messages that can be rendered directly
	// Probably not ideal do this reactively but can address later
	const deviceNameSchema = useMemo(() => {
		const maxLengthError = intl.formatMessage(m.maxLengthError)
		const minLengthError = intl.formatMessage(m.minLengthError)

		return createDeviceNameSchema({
			maxBytesError: maxLengthError,
			maxLengthError,
			minLengthError,
		})
	}, [intl])

	const form = useAppForm({
		defaultValues: { deviceName: deviceInfo.name ? deviceInfo.name : '' },
		validators: { onChange: v.object({ deviceName: deviceNameSchema }) },
		onSubmit: async ({ value }) => {
			const parsedDeviceName = v.parse(deviceNameSchema, value.deviceName)

			try {
				await setOwnDeviceInfo.mutateAsync({
					deviceType: 'desktop',
					name: parsedDeviceName,
				})

				await setOnboardedAt.mutateAsync(Date.now())
			} catch (err) {
				captureException(err)
			}

			await router.navigate({ to: '/app' })
		},
	})

	const iconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	const componentId = useId()
	const formId = `${componentId}-device-name-form`
	const labelId = `${componentId}-label`

	return (
		<>
			<Stack
				direction="column"
				sx={{
					background: BLACK_03,
					borderRadius: 2,
					display: 'flex',
					flex: 1,
					gap: 10,
					justifyContent: 'space-between',
					overflow: 'auto',
					padding: 10,
				}}
			>
				<Container
					maxWidth="sm"
					component={Stack}
					direction="column"
					sx={{ gap: 10 }}
				>
					<Stack direction="column" sx={{ gap: 5 }}>
						<Box sx={{ alignSelf: 'center' }}>
							<Icon
								name="material-symbols-computer"
								htmlColor={ORANGE_00}
								size={iconSize}
							/>
						</Box>

						<Typography
							component="h1"
							variant="heroHeader"
							sx={{ textAlign: 'center' }}
						>
							{intl.formatMessage(m.title)}
						</Typography>
					</Stack>

					<Typography variant="heroSubheading" sx={{ textAlign: 'center' }}>
						{intl.formatMessage(m.description)}
					</Typography>

					<Box
						component="form"
						id={formId}
						noValidate
						autoComplete="off"
						onSubmit={(event) => {
							event.preventDefault()

							if (form.state.isSubmitting) {
								return
							}

							form.handleSubmit()
						}}
					>
						<form.AppField name="deviceName">
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
															v._getGraphemeCount(state.values.deviceName)
														}
													>
														{(count) =>
															intl.formatMessage(m.characterCount, {
																count,
																max: DEVICE_NAME_MAX_LENGTH_GRAPHEMES,
															})
														}
													</form.Subscribe>
												</Typography>
											</Stack>
										}
										id={inputId}
										label={intl.formatMessage(m.deviceName)}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(event) => {
											field.handleChange(event.target.value)
										}}
										required
										slotProps={{
											input: {
												'aria-labelledby': labelId,
												sx: { background: WHITE_00 },
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
					<form.Subscribe selector={(state) => state.canSubmit}>
						{(canSubmit) => (
							<Button
								fullWidth
								form={formId}
								variant="contained"
								type="submit"
								aria-disabled={!canSubmit}
							>
								{intl.formatMessage(m.addName)}
							</Button>
						)}
					</form.Subscribe>
				</Box>
			</Stack>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					setOwnDeviceInfo.status === 'error' ? setOwnDeviceInfo.error : null
				}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							setOwnDeviceInfo.reset()
						}}
					/>
				)}
			</DecentDialog>
		</>
	)
}

const m = defineMessages<{
	readonly title: NoMessageValues
	readonly description: NoMessageValues
	readonly deviceName: NoMessageValues
	readonly minLengthError: NoMessageValues
	readonly maxLengthError: NoMessageValues
	readonly addName: NoMessageValues
	readonly characterCount: {
		readonly count: MessageValue
		readonly max: MessageValue
	}
}>({
	title: {
		id: '$1.routes.onboarding.device-name.title',
		defaultMessage: 'Name Your Device',
		description: 'Title for device name page during onboarding.',
	},
	description: {
		id: '$1.routes.onboarding.device-name.description',
		defaultMessage:
			'Distinct, memorable names help collaborators recognize you.',
		description: 'Description for device name page during onboarding.',
	},
	deviceName: {
		id: '$1.routes.onboarding.device-name.deviceName',
		defaultMessage: 'Device Name',
		description: 'Label for device name text input.',
	},
	minLengthError: {
		id: '$1.routes.onboarding.device-name.minLengthError',
		defaultMessage: 'Enter a Device Name',
		description:
			'Message displayed when required minimum length for device name input is not met.',
	},
	maxLengthError: {
		id: '$1.routes.onboarding.device-name.maxLengthError',
		defaultMessage: 'Too long, try a shorter name.',
		description:
			'Message displayed when maximum length for device name input is exceeded.',
	},
	addName: {
		id: '$1.routes.onboarding.device-name.addName',
		defaultMessage: 'Add Name',
		description: 'Text for submit button to save device name.',
	},
	characterCount: {
		id: 'routes.onboarding.device-name.characterCount',
		defaultMessage: '{count}/{max}',
		description:
			'Displayed character count of device name input out of maximum allowed characters.',
	},
})
