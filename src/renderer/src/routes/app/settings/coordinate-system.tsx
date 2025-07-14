import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import { parse } from 'valibot'

import { BLUE_GREY, DARK_GREY } from '../../../colors'
import { Icon } from '../../../components/icon'
import {
	CoordinateFormatSchema,
	formatCoords,
} from '../../../lib/coordinate-format'
import {
	getAppSettingQueryOptions,
	setAppSettingMutationOptions,
} from '../../../lib/queries/app-settings'

export const Route = createFileRoute('/app/settings/coordinate-system')({
	loader: async ({ context }) => {
		const { queryClient } = context

		await queryClient.ensureQueryData(
			getAppSettingQueryOptions('coordinateFormat'),
		)
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const router = useRouter()

	const queryClient = useQueryClient()

	const { data: coordinateFormat } = useSuspenseQuery(
		getAppSettingQueryOptions('coordinateFormat'),
	)

	const setCoordinateFormat = useMutation(
		setAppSettingMutationOptions({ queryClient, name: 'coordinateFormat' }),
	)

	return (
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
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({ to: '/app/settings', replace: true })
					}}
				>
					<Icon name="material-arrow-back" size={30} />
				</IconButton>
				<Typography
					variant="h1"
					fontWeight={500}
					id="coordinate-system-selection-label"
				>
					{t(m.navTitle)}
				</Typography>
			</Stack>
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

							// TODO: Handle errors
							setCoordinateFormat.mutate(parsedValue)
						}}
					>
						<Stack direction="column" useFlexGap gap={6}>
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
			<Typography color={DARK_GREY}>{secondaryText}</Typography>
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
