import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import { parse } from 'valibot'

import { CoordinateFormatSchema } from '../../../../../../shared/coordinate-format.ts'
import { DARK_GREY } from '../../../../colors.ts'
import { DecentDialog } from '../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../components/error-dialog.tsx'
import { formatCoords } from '../../../../lib/coordinate-format.ts'
import {
	getCoordinateFormatQueryOptions,
	setCoordinateFormatMutationOptions,
} from '../../../../lib/queries/app-settings.ts'

export const Route = createFileRoute('/app/settings/_nested/coordinate-system')(
	{
		staticData: {
			getNavTitle: () => {
				return m.navTitle
			},
		},
		loader: async ({ context }) => {
			const { queryClient } = context

			await queryClient.ensureQueryData(getCoordinateFormatQueryOptions())
		},
		component: RouteComponent,
	},
)

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const { data: coordinateFormat } = useSuspenseQuery(
		getCoordinateFormatQueryOptions(),
	)

	const setCoordinateFormat = useMutation(setCoordinateFormatMutationOptions())

	return (
		<>
			<Container maxWidth="md" disableGutters>
				<Stack direction="column" flex={1}>
					<Box padding={6} overflow="auto">
						<FormControl>
							<RadioGroup
								aria-labelledby="coordinate-system-selection-label"
								value={coordinateFormat}
								name="coordinate-system"
								onChange={(event) => {
									const parsedValue = parse(
										CoordinateFormatSchema,
										event.currentTarget.value,
									)

									setCoordinateFormat.mutate(parsedValue, {
										onError: (err) => {
											captureException(err)
										},
									})
								}}
							>
								<Stack direction="column" gap={6}>
									<FormControlLabel
										value="dd"
										control={<Radio />}
										label={
											<RadioOptionLabel
												primaryText={t(m.ddOptionLabel)}
												secondaryText={EXAMPLE_DD}
											/>
										}
									/>
									<FormControlLabel
										value="dms"
										control={<Radio />}
										label={
											<RadioOptionLabel
												primaryText={t(m.dmsOptionLabel)}
												secondaryText={EXAMPLE_DMS}
											/>
										}
									/>
									<FormControlLabel
										value="utm"
										control={<Radio />}
										label={
											<RadioOptionLabel
												primaryText={t(m.utmOptionLabel)}
												secondaryText={EXAMPLE_UTM}
											/>
										}
									/>
								</Stack>
							</RadioGroup>
						</FormControl>
					</Box>
				</Stack>
			</Container>

			<DecentDialog
				maxWidth="sm"
				value={
					setCoordinateFormat.status === 'error'
						? setCoordinateFormat.error
						: null
				}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							setCoordinateFormat.reset()
						}}
					/>
				)}
			</DecentDialog>
		</>
	)
}

function RadioOptionLabel({
	primaryText,
	secondaryText,
}: {
	primaryText: string
	secondaryText: string
}) {
	return (
		<Stack direction="column">
			<Typography fontWeight={500}>{primaryText}</Typography>
			<Typography color={DARK_GREY} aria-hidden>
				{secondaryText}
			</Typography>
		</Stack>
	)
}

const EXAMPLE_DD = formatCoords({ lon: 0, lat: 0, format: 'dd' })
const EXAMPLE_DMS = formatCoords({ lon: 0, lat: 0, format: 'dms' })
const EXAMPLE_UTM = formatCoords({ lon: 0, lat: 0, format: 'utm' })

const m = defineMessages({
	navTitle: {
		id: 'routes.app.settings.coordinate-system.title',
		defaultMessage: 'Coordinate System',
		description: 'Title of the coordinate system settings page.',
	},
	ddOptionLabel: {
		id: 'routes.app.settings.coordinate-system.ddOptionLabel',
		defaultMessage: 'DD (Decimal Degrees)',
		description: 'Label for the decimal degrees option.',
	},
	dmsOptionLabel: {
		id: 'routes.app.settings.coordinate-system.dmsOptionLabel',
		defaultMessage: 'DMS (Decimal/Minutes/Seconds)',
		description: 'Label for the degrees/minutes/seconds option.',
	},
	utmOptionLabel: {
		id: 'routes.app.settings.coordinate-system.utmOptionLabel',
		defaultMessage: 'UTM (Universal Transverse Mercator)',
		description: 'Label for the universal transverse mercator option.',
	},
})
