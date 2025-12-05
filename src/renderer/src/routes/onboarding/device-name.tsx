import { useMemo } from 'react'
import { useOwnDeviceInfo, useSetOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useStore } from '@tanstack/react-form'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { DARKER_ORANGE, WHITE } from '#renderer/src/colors.ts'
import { ErrorDialog } from '#renderer/src/components/error-dialog.tsx'
import { Icon } from '#renderer/src/components/icon.tsx'
import { useAppForm } from '#renderer/src/hooks/forms.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '#renderer/src/lib/comapeo.ts'
import { DEVICE_NAME_MAX_LENGTH_GRAPHEMES } from '#renderer/src/lib/constants.ts'
import { createDeviceNameSchema } from '#renderer/src/lib/validators/device.ts'

import { StepLayout } from './-layouts.tsx'

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

			await setOwnDeviceInfo.mutateAsync({
				deviceType: 'desktop',
				name: parsedDeviceName,
			})

			await router.navigate({ to: '/onboarding/project' })
		},
	})

	const isSubmitting = useStore(form.store, (state) => {
		return state.isSubmitting
	})

	return (
		<>
			<StepLayout
				stepNumber={2}
				onBack={
					isSubmitting
						? undefined
						: () => {
								if (router.history.canGoBack()) {
									router.history.back()
								} else {
									router.navigate({
										to: '/onboarding/data-and-privacy',
										replace: true,
									})
								}
							}
				}
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

							form.handleSubmit().catch((err) => {
								captureException(err)
							})
						}}
					>
						<form.AppField name="deviceName">
							{(field) => (
								<field.TextField
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
							<form.SubmitButton
								fullWidth
								form="device-name-form"
								variant="contained"
								type="submit"
								aria-disabled={!canSubmit}
								sx={{ maxWidth: 400 }}
							>
								{t(m.addName)}
							</form.SubmitButton>
						)}
					</form.Subscribe>
				</Box>
			</StepLayout>

			<ErrorDialog
				open={setOwnDeviceInfo.status === 'error'}
				errorMessage={setOwnDeviceInfo.error?.toString()}
				onClose={() => {
					setOwnDeviceInfo.reset()
				}}
			/>
		</>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.onboarding.device-name.title',
		defaultMessage: 'Name Your Device',
	},
	description: {
		id: 'routes.onboarding.device-name.description',
		defaultMessage:
			'Distinct, memorable names help collaborators recognize you.',
	},
	deviceName: {
		id: 'routes.onboarding.device-name.deviceName',
		defaultMessage: 'Device Name',
	},
	minLengthError: {
		id: 'routes.onboarding.device-name.minLengthError',
		defaultMessage: 'Enter a Device Name',
	},
	maxLengthError: {
		id: 'routes.onboarding.device-name.maxLengthError',
		defaultMessage: 'Too long, try a shorter name.',
	},
	addName: {
		id: 'routes.onboarding.device-name.addName',
		defaultMessage: 'Add Name',
	},
	characterCount: {
		id: 'routes.onboarding.device-name.characterCount',
		defaultMessage: '{count}/{max}',
	},
})
