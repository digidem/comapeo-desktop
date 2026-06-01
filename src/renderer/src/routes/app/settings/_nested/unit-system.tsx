import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import { captureException } from '@sentry/react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import { parse } from 'valibot'

import { UnitSystemSchema } from '../../../../../../shared/unit-system.ts'
import { DecentDialog } from '../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../components/error-dialog.tsx'
import {
	getUnitSystemQueryOptions,
	setUnitSystemMutationOptions,
} from '../../../../lib/queries/app-settings.ts'
import { RadioOptionLabel } from './-radio-option-label.tsx'
import { BREADCRUMB_NAV_CURRENT_PAGE_LINK_ID } from './-shared.ts'

export const Route = createFileRoute('/app/settings/_nested/unit-system')({
	staticData: {
		getNavTitle: () => {
			return m.navTitle
		},
	},
	loader: async ({ context }) => {
		const { queryClient } = context

		await queryClient.ensureQueryData(getUnitSystemQueryOptions())
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const { data: unitSystem } = useSuspenseQuery(getUnitSystemQueryOptions())

	const setUnitSystem = useMutation(setUnitSystemMutationOptions())

	return (
		<>
			<Container maxWidth="md" disableGutters>
				<Stack direction="column" sx={{ flex: 1 }}>
					<Box sx={{ padding: 6, overflow: 'auto' }}>
						<FormControl>
							<RadioGroup
								aria-labelledby={BREADCRUMB_NAV_CURRENT_PAGE_LINK_ID}
								value={unitSystem}
								name="unit-system"
								onChange={(event) => {
									const parsedValue = parse(
										UnitSystemSchema,
										event.currentTarget.value,
									)

									setUnitSystem.mutate(parsedValue, {
										onError: (err) => {
											captureException(err)
										},
									})
								}}
							>
								<Stack direction="column" sx={{ gap: 6 }}>
									<FormControlLabel
										value="metric"
										control={<Radio />}
										label={
											<RadioOptionLabel
												primaryText={t(m.metricOptionLabel)}
												secondaryText={t(m.metricOptionExample)}
											/>
										}
									/>

									<FormControlLabel
										value="imperial"
										control={<Radio />}
										label={
											<RadioOptionLabel
												primaryText={t(m.imperialOptionLabel)}
												secondaryText={t(m.imperialOptionExample)}
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
	navTitle: {
		id: '$1.routes.app.settings.unit-system.navTitle',
		defaultMessage: 'Unit System',
		description: 'Title of the unit system settings page.',
	},
	metricOptionLabel: {
		id: '$1.routes.app.settings.unit-system.metricOptionLabel',
		defaultMessage: 'Metric System',
		description: 'Label for the metric option.',
	},
	metricOptionExample: {
		id: '$1.routes.app.settings.unit-system.metricOptionExample',
		defaultMessage: 'Kilometers, meters',
		description: 'Displayed examples for the metric option.',
	},
	imperialOptionLabel: {
		id: '$1.routes.app.settings.unit-system.imperialOptionLabel',
		defaultMessage: 'Imperial System',
		description: 'Label for the imperial option.',
	},
	imperialOptionExample: {
		id: '$1.routes.app.settings.unit-system.imperialOptionExample',
		defaultMessage: 'Inches, feet, miles',
		description: 'Displayed examples for the imperial option.',
	},
})
