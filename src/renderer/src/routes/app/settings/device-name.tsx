import { useMemo } from 'react'
import { useOwnDeviceInfo, useSetOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { BLUE_GREY, WHITE } from '../../../colors'
import { ErrorDialog } from '../../../components/error-dialog'
import { Icon } from '../../../components/icon'
import { useAppForm } from '../../../hooks/forms'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../lib/comapeo'
import { DEVICE_NAME_MAX_LENGTH_GRAPHEMES } from '../../../lib/constants'
import { createDeviceNameSchema } from '../../../lib/validators/device'

export const Route = createFileRoute('/app/settings/device-name')({
	loader: async ({ context }) => {
		const { clientApi, queryClient } = context

		// TODO: not ideal to do this but requires major changes to @comapeo/core-react
		// copied from https://github.com/digidem/comapeo-core-react/blob/e56979321e91440ad6e291521a9e3ce8eb91200d/src/lib/react-query/client.ts#L21
		await queryClient.ensureQueryData({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
			queryFn: async () => {
				return clientApi.getDeviceInfo()
			},
		})
	},
	component: RouteComponent,
})

const FORM_ID = 'device-name-form'

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const router = useRouter()

	const { data: deviceInfo } = useOwnDeviceInfo()
	const setOwnDeviceInfo = useSetOwnDeviceInfo()

	// TODO: We want to provide translated error messages that can be rendered directly
	// Probably not ideal do this reactively but can address later
	const onChangeSchema = useMemo(() => {
		const maxLengthError = t(m.maxLengthError)
		const minLengthError = t(m.minLengthError)

		return v.object({
			deviceName: createDeviceNameSchema({
				maxBytesError: maxLengthError,
				maxLengthError,
				minLengthError,
			}),
		})
	}, [t])

	const form = useAppForm({
		defaultValues: {
			deviceName: deviceInfo.name ? deviceInfo.name : '',
		},
		validators: {
			onChange: onChangeSchema,
		},
		onSubmit: async ({ value }) => {
			const { deviceName } = v.parse(onChangeSchema, value)

			// TODO: Catch error and report to Sentry
			await setOwnDeviceInfo.mutateAsync({
				deviceType: 'desktop',
				name: deviceName,
			})

			if (router.history.canGoBack()) {
				router.history.back()
				return
			}

			router.navigate({
				to: '/app/settings',
				replace: true,
			})
		},
	})

	return (
		<>
			<Stack direction="column" flex={1}>
				<Stack
					direction="row"
					alignItems="center"
					component="nav"
					useFlexGap
					gap={4}
					padding={4}
					borderBottom={`1px solid ${BLUE_GREY}`}
				>
					<IconButton
						onClick={() => {
							if (form.state.isSubmitting) {
								return
							}

							if (router.history.canGoBack()) {
								router.history.back()
								return
							}

							router.navigate({ to: '/app/settings', replace: true })
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
					<Box padding={6}>
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
							<form.AppField name="deviceName">
								{(field) => (
									<field.TextField
										required
										fullWidth
										label={t(m.inputLabel)}
										value={field.state.value}
										error={!field.state.meta.isValid}
										name={field.name}
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
					</Box>

					<Stack
						direction="column"
						useFlexGap
						gap={4}
						paddingX={6}
						paddingBottom={6}
						position="sticky"
						bottom={0}
						alignItems="center"
					>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<>
									<Button
										type="button"
										variant="outlined"
										size="large"
										fullWidth
										disableElevation
										aria-disabled={isSubmitting}
										onClick={() => {
											if (isSubmitting) return

											if (router.history.canGoBack()) {
												router.history.back()
												return
											}

											router.navigate({ to: '/app/settings', replace: true })
										}}
										sx={{ maxWidth: 400 }}
									>
										{t(m.cancel)}
									</Button>

									<form.SubmitButton
										type="submit"
										form={FORM_ID}
										fullWidth
										disableElevation
										variant="contained"
										size="large"
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
	navTitle: {
		id: 'routes.app.settings.device-name.navTitle',
		defaultMessage: 'Device Name',
		description: 'Title of the device name settings page.',
	},
	inputLabel: {
		id: 'routes.app.settings.device-name.inputLabel',
		defaultMessage: 'Device Name',
		description: 'Label for the device name input.',
	},
	characterCount: {
		id: 'routes.app.settings.device-name.characterCount',
		defaultMessage: '{count}/{max}',
		description:
			'Displays number of characters in input out of the maximum allowed characters.',
	},
	save: {
		id: 'routes.app.settings.device-name.save',
		defaultMessage: 'Save',
		description: 'Label for save button.',
	},
	cancel: {
		id: 'routes.app.settings.device-name.cancel',
		defaultMessage: 'Cancel',
		description: 'Label for cancel button.',
	},
	minLengthError: {
		id: 'routes.app.settings.device-name.minLengthError',
		defaultMessage: 'Enter a Device Name',
		description: 'Error message for device name that is too short.',
	},
	maxLengthError: {
		id: 'routes.app.settings.device-name.maxLengthError',
		defaultMessage: 'Too long, try a shorter name.',
		description: 'Error message for device name that is too long.',
	},
})
