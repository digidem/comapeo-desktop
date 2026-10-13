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

import { BLUE_05 } from '../../../../../../shared/colors.ts'
import { UnitSystemSchema } from '../../../../../../shared/unit-system.ts'
import { DecentDialog } from '../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../components/error-dialog.tsx'
import { Icon } from '../../../../components/icon.tsx'
import {
	getUnitSystemQueryOptions,
	setUnitSystemMutationOptions,
} from '../../../../lib/queries/app-settings.ts'
import { RadioOptionLabel } from './radio-option-label.tsx'

export function UnitSystemSection({
	headingIconSize,
}: {
	headingIconSize: string
}) {
	const intl = useIntl()

	const { data: unitSystem } = useSuspenseQuery(getUnitSystemQueryOptions())

	const setUnitSystem = useMutation(setUnitSystemMutationOptions())

	const labelId = `label-${useId()}`

	return (
		<>
			<Stack component="section" direction="column" sx={{ gap: 4 }}>
				<Stack
					component="h2"
					direction="row"
					sx={{ alignItems: 'center', gap: 2, margin: 0 }}
				>
					<Icon name="material-symbols-square-foot" size={headingIconSize} />

					<Typography id={labelId} variant="sectionLabel">
						{intl.formatMessage(m.unitSystemSectionTitle)}
					</Typography>
				</Stack>

				<FormControl
					sx={{ border: `1px solid ${BLUE_05}`, borderRadius: 2, padding: 6 }}
				>
					<RadioGroup
						aria-labelledby={labelId}
						name="unit-system"
						onChange={(event) => {
							const parsedValue = v.parse(
								UnitSystemSchema,
								event.currentTarget.value,
							)

							setUnitSystem.mutate(parsedValue, {
								onError: (err) => {
									captureException(err)
								},
							})
						}}
						value={unitSystem}
					>
						<Stack direction="column" sx={{ gap: 6 }}>
							<FormControlLabel
								value="metric"
								control={<Radio />}
								label={
									<RadioOptionLabel
										primaryText={intl.formatMessage(m.unitSystemMetric)}
										secondaryText={intl.formatMessage(
											m.unitSystemMetricExamples,
										)}
									/>
								}
								sx={{ gap: 2 }}
							/>

							<FormControlLabel
								value="imperial"
								control={<Radio />}
								label={
									<RadioOptionLabel
										primaryText={intl.formatMessage(m.unitSystemImperial)}
										secondaryText={intl.formatMessage(
											m.unitSystemImperialExamples,
										)}
									/>
								}
								sx={{ gap: 2 }}
							/>
						</Stack>
					</RadioGroup>
				</FormControl>
			</Stack>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={setUnitSystem.status === 'error' ? setUnitSystem.error : null}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							setUnitSystem.reset()
						}}
					/>
				)}
			</DecentDialog>
		</>
	)
}

const m = defineMessages({
	unitSystemSectionTitle: {
		id: '$1.routes.app.settings.index.unitSystemSectionTitle',
		defaultMessage: 'Unit System',
		description: 'Section title for unit system settings.',
	},
	unitSystemSettingsAccessibleLabel: {
		id: 'routes.app.settings.index.unitSystemSettingsAccessibleLabel',
		defaultMessage: 'Go to unit system settings.',
		description:
			'Accessible label for link item that navigates to unit system settings page.',
	},
	unitSystemImperial: {
		id: '$1.routes.app.settings.index.unitSystemImperial',
		defaultMessage: 'Imperial System',
		description: 'Label for imperial unit system option.',
	},
	unitSystemImperialExamples: {
		id: '$1.routes.app.settings.index.unitSystemImperialExamples',
		defaultMessage: 'Inches, feet, miles',
		description: 'Displayed examples for the imperial option.',
	},
	unitSystemMetric: {
		id: '$1.routes.app.settings.index.unitSystemMetric',
		defaultMessage: 'Metric System',
		description: 'Label for metric unit system option.',
	},
	unitSystemMetricExamples: {
		id: '$1.routes.app.settings.index.unitSystemMetricExamples',
		defaultMessage: 'Kilometers, meters',
		description: 'Displayed examples for the metric option.',
	},
})
