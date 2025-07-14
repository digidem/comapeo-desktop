import { useMemo } from 'react'
import { useOwnDeviceInfo, useSetOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { DARKER_ORANGE, LIGHT_GREY, WHITE } from '../../colors'
import { Icon } from '../../components/icon'
import { useAppForm } from '../../hooks/use-app-form'
import { DEVICE_NAME_MAX_LENGTH_GRAPHEMES } from '../../lib/constants'
import { createDeviceNameSchema } from '../../lib/schemas/device-name'

export const Route = createFileRoute('/onboarding/device-name')({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const navigate = useNavigate()

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

			navigate({ to: '/onboarding/project' })
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
						name="material-symbols-computer"
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
					<form.AppField name="deviceName">
						{(field) => (
							<field.TextField
								required
								fullWidth
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
			</Container>

			<Box display="flex" justifyContent="center">
				<form.Subscribe selector={(state) => state.canSubmit}>
					{(canSubmit) => (
						<form.SubmitButton
							fullWidth
							form="device-name-form"
							variant="contained"
							size="large"
							disableElevation
							type="submit"
							aria-disabled={!canSubmit}
							sx={{ maxWidth: 400 }}
						>
							{t(m.addName)}
						</form.SubmitButton>
					)}
				</form.Subscribe>
			</Box>
		</Stack>
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
