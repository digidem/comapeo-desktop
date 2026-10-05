import { useEffect, useId, useMemo, useState, type ComponentProps } from 'react'
import { useOwnDeviceInfo, useSetOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { Block } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import * as v from 'valibot'

import { GREEN, WHITE } from '../../../../colors.ts'
import { DecentDialog } from '../../../../components/decent-dialog.tsx'
import { DecentTextField } from '../../../../components/decent-text-field.tsx'
import { DiscardEditsDialogContent } from '../../../../components/discard-edits-dialog.tsx'
import { ErrorDialogContent } from '../../../../components/error-dialog.tsx'
import { Icon } from '../../../../components/icon.tsx'
import { useAppForm } from '../../../../hooks/forms.ts'
import { useIconSizeBasedOnTypography } from '../../../../hooks/icon.ts'
import { DEVICE_NAME_MAX_LENGTH_GRAPHEMES } from '../../../../lib/constants.ts'
import { createDeviceNameSchema } from '../../../../lib/validators/device.ts'
import { DeviceIcon } from '../../projects/-shared/device-icon.tsx'

type EditState = 'idle' | 'active' | 'success'

export function DeviceNameSection({
	headingIconSize,
}: {
	headingIconSize: string
}) {
	const intl = useIntl()

	const [editState, setEditState] = useState<EditState>('idle')

	useEffect(() => {
		let timeoutId: number | undefined

		if (editState === 'success') {
			timeoutId = window.setTimeout(() => {
				setEditState('idle')
			}, 5_000)
		}

		return () => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId)
			}
		}
	}, [editState, setEditState])

	const componentId = useId()
	const formId = `${componentId}-device-name-form`
	const labelId = `${componentId}-label`

	const { data: deviceInfo } = useOwnDeviceInfo()
	const setOwnDeviceInfo = useSetOwnDeviceInfo()

	// TODO: We want to provide translated error messages that can be rendered directly
	// Probably not ideal do this reactively but can address later
	const onChangeSchema = useMemo(() => {
		const maxLengthError = intl.formatMessage(m.deviceNameMaxLengthError)
		const minLengthError = intl.formatMessage(m.deviceNameMinLengthError)

		return v.object({
			deviceName: createDeviceNameSchema({
				maxBytesError: maxLengthError,
				maxLengthError,
				minLengthError,
			}),
		})
	}, [intl])

	const form = useAppForm({
		defaultValues: { deviceName: deviceInfo.name || '' },
		validators: { onChange: onChangeSchema },
		onSubmit: ({ formApi, value }) => {
			if (formApi.getFieldMeta('deviceName')?.isDefaultValue) {
				setEditState('idle')
				return
			}

			const { deviceName } = v.parse(onChangeSchema, value)

			setOwnDeviceInfo.mutate(
				{ deviceType: 'desktop', name: deviceName },
				{
					onError: (error) => {
						captureException(error)
					},
					onSuccess: () => {
						setEditState('success')
					},
				},
			)
		},
	})

	const successIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body2',
		multiplier: 0.5,
	})

	return (
		<>
			<Stack component="section" direction="column" sx={{ gap: 4 }}>
				<Stack
					component="h2"
					direction="row"
					sx={{ alignItems: 'center', gap: 4, margin: 0 }}
				>
					<DeviceIcon
						aria-hidden
						deviceType={deviceInfo.deviceType}
						size={headingIconSize}
					/>

					<Typography
						id={labelId}
						variant="body2"
						sx={{ fontWeight: 500, textTransform: 'uppercase' }}
					>
						{intl.formatMessage(m.deviceNameSectionTitle)}
					</Typography>

					{editState === 'success' ? (
						<Box
							sx={{
								bgcolor: GREEN,
								borderRadius: '50%',
								display: 'flex',
								padding: 1,
							}}
						>
							<Icon
								name="material-check"
								htmlColor={WHITE}
								size={successIconSize}
							/>
						</Box>
					) : null}
				</Stack>

				<Stack direction="column" sx={{ flex: 1, overflow: 'auto', gap: 4 }}>
					<Stack direction="column" sx={{ flex: 1 }}>
						<Stack direction="column" sx={{ flex: 1, gap: 10 }}>
							<Box
								component="form"
								id={formId}
								noValidate
								autoComplete="off"
								onSubmit={(event) => {
									event.preventDefault()

									if (editState !== 'active') {
										setEditState('active')
										return
									}

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

										const conditionalProps: ComponentProps<
											typeof DecentTextField
										> =
											editState === 'active'
												? {
														'aria-describedby': field.state.meta.isValid
															? undefined
															: errorTextId,
														error: !field.state.meta.isValid,
														helperText: (
															<Stack
																direction="row"
																sx={{
																	color: field.state.meta.isValid
																		? undefined
																		: (theme) => theme.palette.error.main,
																	justifyContent: 'space-between',
																}}
															>
																<Typography
																	id={errorTextId}
																	component="span"
																	variant="body2"
																>
																	{field.state.meta.errors[0]?.message}
																</Typography>

																<Typography
																	component="output"
																	htmlFor={inputId}
																	name="character-count"
																	variant="body2"
																>
																	<form.Subscribe
																		selector={(state) =>
																			state.values.deviceName
																				? v._getGraphemeCount(
																						state.values.deviceName,
																					)
																				: 0
																		}
																	>
																		{(count) =>
																			intl.formatMessage(
																				m.deviceNameCharacterCount,
																				{
																					count,
																					max: DEVICE_NAME_MAX_LENGTH_GRAPHEMES,
																				},
																			)
																		}
																	</form.Subscribe>
																</Typography>
															</Stack>
														),
														onBlur: field.handleBlur,
														onChange: (event) => {
															field.handleChange(event.target.value)
														},
														value: field.state.value,
													}
												: {
														endAdornment: (
															<Typography component="span" color="primary">
																{intl.formatMessage(m.deviceNameEdit)}
															</Typography>
														),
														onClick: () => {
															setEditState('active')
														},
														readOnly: true,
														sx: { cursor: 'default' },
														value: deviceInfo.name,
													}

										return (
											<DecentTextField
												{...conditionalProps}
												fullWidth
												id={inputId}
												name={field.name}
												required
												slotProps={{ input: { 'aria-labelledby': labelId } }}
											/>
										)
									}}
								</form.AppField>
							</Box>
						</Stack>
					</Stack>

					{editState === 'active' ? (
						<Stack
							direction="row"
							sx={{ alignItems: 'center', gap: 4, justifyContent: 'center' }}
						>
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<>
										<Button
											aria-disabled={!canSubmit}
											form={formId}
											fullWidth
											loading={isSubmitting}
											loadingPosition="start"
											startIcon={
												<Icon name="material-check-circle-outline-rounded" />
											}
											sx={{ flex: 1, maxWidth: 400 }}
											type="submit"
											variant="contained"
										>
											{intl.formatMessage(m.deviceNameSave)}
										</Button>

										<Button
											aria-disabled={!canSubmit}
											fullWidth
											onClick={() => {
												form.resetField('deviceName')
												setEditState('idle')
											}}
											sx={{ flex: 1, maxWidth: 400 }}
											type="button"
											variant="outlined"
										>
											{intl.formatMessage(m.deviceNameCancel)}
										</Button>
									</>
								)}
							</form.Subscribe>
						</Stack>
					) : null}
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
	readonly deviceNameSectionTitle: NoMessageValues
	readonly deviceNameEdit: NoMessageValues
	readonly deviceNameSettingsAccessibleLabel: NoMessageValues
	readonly deviceNameCharacterCount: {
		readonly count: MessageValue
		readonly max: MessageValue
	}
	readonly deviceNameSave: NoMessageValues
	readonly deviceNameCancel: NoMessageValues
	readonly deviceNameMinLengthError: NoMessageValues
	readonly deviceNameMaxLengthError: NoMessageValues
}>({
	deviceNameSectionTitle: {
		id: '$1.routes.app.settings.index.deviceNameSectionTitle',
		defaultMessage: 'Device Name',
		description: 'Section title for device name settings.',
	},
	deviceNameEdit: {
		id: '$1.routes.app.settings.index.deviceNameEdit',
		defaultMessage: 'Edit',
		description: 'Button text for navigating to page to edit device name.',
	},
	deviceNameSettingsAccessibleLabel: {
		id: 'routes.app.settings.index.deviceNameSettingsAccessibleLabel',
		defaultMessage: 'Go to device name settings.',
		description:
			'Accessible label for link item that navigates to device name settings page.',
	},
	deviceNameCharacterCount: {
		id: 'routes.app.settings.index.deviceNameCharacterCount',
		defaultMessage: '{count}/{max}',
		description:
			'Displays number of characters in device name input out of the maximum allowed characters.',
	},
	deviceNameSave: {
		id: '$1.routes.app.settings.index.deviceNameSave',
		defaultMessage: 'Save',
		description: 'Label for save button for device name input.',
	},
	deviceNameCancel: {
		id: '$1.routes.app.settings.index.deviceNameCancel',
		defaultMessage: 'Cancel',
		description: 'Label for cancel button for device name input.',
	},
	deviceNameMinLengthError: {
		id: '$1.routes.app.settings.index.deviceNameMinLengthError',
		defaultMessage: 'Enter a Device Name',
		description: 'Error message for device name that is too short.',
	},
	deviceNameMaxLengthError: {
		id: '$1.routes.app.settings.index.deviceNameMaxLengthError',
		defaultMessage: 'Too long, try a shorter name.',
		description: 'Error message for device name that is too long.',
	},
})
