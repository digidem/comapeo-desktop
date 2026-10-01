import { useId, useMemo } from 'react'
import { useOwnDeviceInfo, useSetOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Block, createFileRoute, useRouter } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import * as v from 'valibot'

import { BLUE_GREY, WHITE } from '../../../colors.ts'
import { DecentDialog } from '../../../components/decent-dialog.tsx'
import { DiscardEditsDialogContent } from '../../../components/discard-edits-dialog.tsx'
import { ErrorDialogContent } from '../../../components/error-dialog.tsx'
import { Icon } from '../../../components/icon.tsx'
import { useAppForm } from '../../../hooks/forms.ts'
import { useIconSizeBasedOnTypography } from '../../../hooks/icon.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../lib/comapeo.ts'
import { DEVICE_NAME_MAX_LENGTH_GRAPHEMES } from '../../../lib/constants.ts'
import { createDeviceNameSchema } from '../../../lib/validators/device.ts'

export const Route = createFileRoute('/app/settings/device-name')({
	staticData: {
		getNavTitle: () => {
			return m.navTitle
		},
	},
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
	component: RouteComponent,
})

function RouteComponent() {
	const intl = useIntl()

	const router = useRouter()

	const headerIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 1.5,
	})

	const { data: deviceInfo } = useOwnDeviceInfo()
	const setOwnDeviceInfo = useSetOwnDeviceInfo()

	// TODO: We want to provide translated error messages that can be rendered directly
	// Probably not ideal do this reactively but can address later
	const onChangeSchema = useMemo(() => {
		const maxLengthError = intl.formatMessage(m.maxLengthError)
		const minLengthError = intl.formatMessage(m.minLengthError)

		return v.object({
			deviceName: createDeviceNameSchema({
				maxBytesError: maxLengthError,
				maxLengthError,
				minLengthError,
			}),
		})
	}, [intl])

	const form = useAppForm({
		defaultValues: { deviceName: deviceInfo.name ? deviceInfo.name : '' },
		validators: { onChange: onChangeSchema },
		onSubmit: async ({ value }) => {
			const { deviceName } = v.parse(onChangeSchema, value)

			// TODO: Catch error and report to Sentry
			await setOwnDeviceInfo.mutateAsync({
				deviceType: 'desktop',
				name: deviceName,
			})

			if (router.history.canGoBack()) {
				router.history.back({ ignoreBlocker: true })
				return
			}

			router.navigate({
				to: '/app/settings',
				replace: true,
				ignoreBlocker: true,
			})
		},
	})

	const formId = `device-name-form-${useId()}`

	return (
		<>
			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Stack
					component="header"
					direction="row"
					sx={{
						alignItems: 'center',
						borderBottom: `1px solid ${BLUE_GREY}`,
						gap: 2,
						paddingBlock: 4,
						paddingInline: 6,
					}}
				>
					<IconButton
						aria-label={intl.formatMessage(m.goBackAccessibleLabel)}
						color="inherit"
						onClick={() => {
							if (router.history.canGoBack()) {
								router.history.back()
								return
							}

							router.navigate({ to: '/app', replace: true })
						}}
					>
						<Icon name="material-arrow-back" size={headerIconSize} />
					</IconButton>

					<Typography
						variant="h1"
						sx={{ fontWeight: 500, textAlign: 'center' }}
					>
						{intl.formatMessage(m.navTitle)}
					</Typography>
				</Stack>

				<Stack
					sx={{
						flex: 1,
						overflow: 'auto',
						scrollbarGutter: 'stable both-edges',
					}}
				>
					<Container disableGutters maxWidth="sm">
						<Stack direction="column" sx={{ flex: 1, padding: 6, gap: 10 }}>
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
								<form.AppField name="deviceName">
									{(field) => (
										<TextField
											required
											fullWidth
											label={intl.formatMessage(m.inputLabel)}
											value={field.state.value}
											error={!field.state.meta.isValid}
											name={field.name}
											onChange={(event) => {
												field.handleChange(event.target.value)
											}}
											slotProps={{
												input: { style: { backgroundColor: WHITE } },
											}}
											onBlur={field.handleBlur}
											helperText={
												<Stack
													component="span"
													direction="row"
													sx={{ justifyContent: 'space-between' }}
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
																intl.formatMessage(m.characterCount, {
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

							<Stack direction="row" sx={{ gap: 4, justifyContent: 'center' }}>
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
														router.history.back({ ignoreBlocker: true })
														return
													}

													router.navigate({
														to: '/app/settings',
														replace: true,
														ignoreBlocker: true,
													})
												}}
												sx={{ maxWidth: 400 }}
											>
												{intl.formatMessage(m.cancel)}
											</Button>

											<Button
												type="submit"
												form={formId}
												fullWidth
												variant="contained"
												loading={isSubmitting}
												loadingPosition="start"
												aria-disabled={!canSubmit}
												sx={{ maxWidth: 400 }}
											>
												{intl.formatMessage(m.save)}
											</Button>
										</>
									)}
								</form.Subscribe>
							</Stack>
						</Stack>
					</Container>
				</Stack>
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

const m = defineMessages<{
	readonly goBackAccessibleLabel: NoMessageValues
	readonly navTitle: NoMessageValues
	readonly inputLabel: NoMessageValues
	readonly characterCount: {
		readonly count: MessageValue
		readonly max: MessageValue
	}
	readonly save: NoMessageValues
	readonly cancel: NoMessageValues
	readonly minLengthError: NoMessageValues
	readonly maxLengthError: NoMessageValues
}>({
	goBackAccessibleLabel: {
		id: 'routes.app.settings.device-name.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button.',
	},
	navTitle: {
		id: '$1.routes.app.settings.device-name.navTitle',
		defaultMessage: 'Device Name',
		description: 'Title of the device name settings page.',
	},
	inputLabel: {
		id: '$1.routes.app.settings.device-name.inputLabel',
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
		id: '$1.routes.app.settings.device-name.save',
		defaultMessage: 'Save',
		description: 'Label for save button.',
	},
	cancel: {
		id: '$1.routes.app.settings.device-name.cancel',
		defaultMessage: 'Cancel',
		description: 'Label for cancel button.',
	},
	minLengthError: {
		id: '$1.routes.app.settings.device-name.minLengthError',
		defaultMessage: 'Enter a Device Name',
		description: 'Error message for device name that is too short.',
	},
	maxLengthError: {
		id: '$1.routes.app.settings.device-name.maxLengthError',
		defaultMessage: 'Too long, try a shorter name.',
		description: 'Error message for device name that is too long.',
	},
})
