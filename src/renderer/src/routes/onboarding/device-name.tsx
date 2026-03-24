import { useMemo } from 'react'
import { useOwnDeviceInfo, useSetOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { DARKER_ORANGE, LIGHT_GREY, WHITE } from '../../colors.ts'
import { DecentDialog } from '../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../components/error-dialog.tsx'
import { Icon } from '../../components/icon.tsx'
import { useAppForm } from '../../hooks/forms.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../lib/comapeo.ts'
import { DEVICE_NAME_MAX_LENGTH_GRAPHEMES } from '../../lib/constants.ts'
import { createDeviceNameSchema } from '../../lib/validators/device.ts'

export const Route = createFileRoute('/onboarding/device-name')({
	loader: async ({ context }) => {
		const { clientApi, queryClient } = context

		await queryClient.ensureQueryData({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
			queryFn: async () => {
				return clientApi.getDeviceInfo()
			},
		})
	},
	staticData: {
		onboardingStepNumber: 2,
	},
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()

	const { formatMessage: t } = useIntl()

	const { data: deviceInfo } = useOwnDeviceInfo()
	const setOwnDeviceInfo = useSetOwnDeviceInfo()

	// TODO: We want to provide translated error messages that can be rendered directly
	// Probably not ideal do this reactively but can address later
	const deviceNameSchema = useMemo(() => {
		const maxLengthError = t(m.maxLengthError)
		const minLengthError = t(m.minLengthError)

		return createDeviceNameSchema({
			maxBytesError: maxLengthError,
			maxLengthError,
			minLengthError,
		})
	}, [t])

	const form = useAppForm({
		defaultValues: {
			deviceName: deviceInfo.name ? deviceInfo.name : '',
		},
		validators: {
			onChange: v.object({ deviceName: deviceNameSchema }),
		},
		onSubmit: async ({ value }) => {
			const parsedDeviceName = v.parse(deviceNameSchema, value.deviceName)

			try {
				await setOwnDeviceInfo.mutateAsync({
					deviceType: 'desktop',
					name: parsedDeviceName,
				})
			} catch (err) {
				captureException(err)
			}

			await router.navigate({
				to: '/app',
				search: { fromFlow: { name: 'onboarding' } },
				mask: { to: '/app', unmaskOnReload: true },
			})
		},
	})

	return (
		<>
			<Stack
				display="flex"
				direction="column"
				justifyContent="space-between"
				flex={1}
				gap={10}
				bgcolor={LIGHT_GREY}
				padding={10}
				borderRadius={2}
				overflow="auto"
			>
				<Container maxWidth="sm" component={Stack} direction="column" gap={10}>
					<Stack direction="column" gap={5}>
						<Box alignSelf="center">
							<Icon
								name="material-symbols-computer"
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

							if (form.state.isSubmitting) {
								return
							}

							form.handleSubmit()
						}}
					>
						<form.AppField name="deviceName">
							{(field) => (
								<TextField
									id={field.name}
									required
									fullWidth
									autoFocus
									label={t(m.deviceName)}
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
														v._getGraphemeCount(state.values.deviceName)
													}
												>
													{(count) =>
														t(m.characterCount, {
															count,
															max: DEVICE_NAME_MAX_LENGTH_GRAPHEMES,
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
					<form.Subscribe selector={(state) => state.canSubmit}>
						{(canSubmit) => (
							<Button
								fullWidth
								form="device-name-form"
								variant="contained"
								type="submit"
								aria-disabled={!canSubmit}
								sx={{ maxWidth: 400 }}
							>
								{t(m.addName)}
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

const m = defineMessages({
	title: {
		id: 'routes.onboarding.device-name.title',
		defaultMessage: 'Name Your Device',
		description: 'Title for device name page during onboarding.',
	},
	description: {
		id: 'routes.onboarding.device-name.description',
		defaultMessage:
			'Distinct, memorable names help collaborators recognize you.',
		description: 'Description for device name page during onboarding.',
	},
	deviceName: {
		id: 'routes.onboarding.device-name.deviceName',
		defaultMessage: 'Device Name',
		description: 'Label for device name text input.',
	},
	minLengthError: {
		id: 'routes.onboarding.device-name.minLengthError',
		defaultMessage: 'Enter a Device Name',
		description:
			'Message displayed when required minimum length for device name input is not met.',
	},
	maxLengthError: {
		id: 'routes.onboarding.device-name.maxLengthError',
		defaultMessage: 'Too long, try a shorter name.',
		description:
			'Message displayed when maximum length for device name input is exceeded.',
	},
	addName: {
		id: 'routes.onboarding.device-name.addName',
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
