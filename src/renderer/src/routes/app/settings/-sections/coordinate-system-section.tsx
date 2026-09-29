import { useId } from 'react'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { CoordinateFormatSchema } from '../../../../../../shared/coordinate-format.ts'
import { BLUE_GREY } from '../../../../colors.ts'
import { DecentDialog } from '../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../components/error-dialog.tsx'
import { Icon } from '../../../../components/icon.tsx'
import { formatCoords } from '../../../../lib/coordinate-format.ts'
import {
	getCoordinateFormatQueryOptions,
	setCoordinateFormatMutationOptions,
} from '../../../../lib/queries/app-settings.ts'
import { RadioOptionLabel } from './radio-option-label.tsx'

const EXAMPLE_DD = formatCoords({ lon: 0, lat: 0, format: 'dd' })
const EXAMPLE_DMS = formatCoords({ lon: 0, lat: 0, format: 'dms' })
const EXAMPLE_UTM = formatCoords({ lon: 0, lat: 0, format: 'utm' })

export function CoordinateSystemSection({
	headingIconSize,
}: {
	headingIconSize: string
}) {
	const intl = useIntl()

	const { data: coordinateFormat } = useSuspenseQuery(
		getCoordinateFormatQueryOptions(),
	)

	const setCoordinateFormat = useMutation(setCoordinateFormatMutationOptions())

	const labelId = `label-${useId()}`

	return (
		<>
			<Stack direction="column" sx={{ gap: 4 }}>
				<Stack
					component="h2"
					direction="row"
					sx={{ alignItems: 'center', gap: 4, margin: 0 }}
				>
					<Icon name="material-explore-filled" size={headingIconSize} />

					<Typography
						id={labelId}
						variant="body2"
						sx={{ fontWeight: 500, textTransform: 'uppercase' }}
					>
						{intl.formatMessage(m.coordinateSystemSectionTitle)}
					</Typography>
				</Stack>

				<FormControl
					sx={{ border: `1px solid ${BLUE_GREY}`, borderRadius: 2, padding: 6 }}
				>
					<RadioGroup
						aria-labelledby={labelId}
						name="coordinate-system"
						onChange={(event) => {
							const parsedValue = v.parse(
								CoordinateFormatSchema,
								event.currentTarget.value,
							)

							setCoordinateFormat.mutate(parsedValue, {
								onError: (err) => {
									captureException(err)
								},
							})
						}}
						value={coordinateFormat}
					>
						<Stack direction="column" sx={{ gap: 6 }}>
							<FormControlLabel
								value="dd"
								control={<Radio />}
								label={
									<RadioOptionLabel
										primaryText={intl.formatMessage(
											m.coordinateSystemDdCoordinates,
										)}
										secondaryText={EXAMPLE_DD}
									/>
								}
							/>

							<FormControlLabel
								value="dms"
								control={<Radio />}
								label={
									<RadioOptionLabel
										primaryText={intl.formatMessage(
											m.coordinateSystemDmsCoordinates,
										)}
										secondaryText={EXAMPLE_DMS}
									/>
								}
							/>

							<FormControlLabel
								value="utm"
								control={<Radio />}
								label={
									<RadioOptionLabel
										primaryText={intl.formatMessage(
											m.coordinateSystemUtmCoordinates,
										)}
										secondaryText={EXAMPLE_UTM}
									/>
								}
							/>
						</Stack>
					</RadioGroup>
				</FormControl>
			</Stack>

			<DecentDialog
				fullWidth
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

const m = defineMessages({
	coordinateSystemSectionTitle: {
		id: '$1.routes.app.settings.index.coordinateSystemSectionTitle',
		defaultMessage: 'Coordinate System',
		description: 'Section title for coordinate system settings.',
	},
	coordinateSystemDdCoordinates: {
		id: '$1.routes.app.settings.index.coordinateSystemDdCoordinates',
		defaultMessage: 'DD Coordinates (Decimal Degrees)',
		description: 'Label for Decimal Degrees coordinate system option.',
	},
	coordinateSystemDmsCoordinates: {
		id: '$1.routes.app.settings.index.coordinateSystemDmsCoordinates',
		defaultMessage: 'DMS Coordinates (Decimal/Minutes/Seconds)',
		description: 'Label for Degrees/Minutes/Seconds coordinate system option.',
	},
	coordinateSystemUtmCoordinates: {
		id: '$1.routes.app.settings.index.coordinateSystemUtmCoordinates',
		defaultMessage: 'UTM Coordinates (Universal Transverse Mercator)',
		description:
			'Label for Universal Transverse Mercator coordinate system option.',
	},
})
