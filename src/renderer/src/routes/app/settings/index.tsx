import type { ReactNode } from 'react'
import { useOwnDeviceInfo } from '@comapeo/core-react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARKER_ORANGE, DARK_GREY } from '../../../colors'
import { ButtonLink, IconButtonLink } from '../../../components/button-link'
import { Icon } from '../../../components/icon'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../lib/constants'
import { getAppSettingQueryOptions } from '../../../lib/queries/app-settings'

export const Route = createFileRoute('/app/settings/')({
	loader: async ({ context }) => {
		const { clientApi, queryClient } = context

		await Promise.all([
			// TODO: not ideal to do this but requires major changes to @comapeo/core-react
			// copied from https://github.com/digidem/comapeo-core-react/blob/e56979321e91440ad6e291521a9e3ce8eb91200d/src/lib/react-query/client.ts#L21
			queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
				queryFn: async () => {
					return clientApi.getDeviceInfo()
				},
			}),
			queryClient.ensureQueryData(
				getAppSettingQueryOptions('coordinateFormat'),
			),
		])
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const { data: deviceInfo } = useOwnDeviceInfo()

	const { data: coordinateFormat } = useSuspenseQuery(
		getAppSettingQueryOptions('coordinateFormat'),
	)

	return (
		<Stack
			direction="column"
			padding={6}
			flex={1}
			overflow="auto"
			useFlexGap
			gap={6}
		>
			<Stack
				direction="column"
				border={`1px solid ${BLUE_GREY}`}
				borderRadius={2}
				useFlexGap
				gap={4}
				alignItems="center"
				padding={6}
			>
				<Icon
					name="material-symbols-info"
					size={100}
					htmlColor={DARKER_ORANGE}
				/>

				<Typography variant="h1" fontWeight={500}>
					{t(m.title)}
				</Typography>

				<Typography color="textSecondary" textAlign="center">
					{t(m.description)}
				</Typography>
			</Stack>

			<SettingRow
				icon={
					<Icon
						name="material-symbols-computer"
						htmlColor={DARK_GREY}
						size={30}
					/>
				}
				actionButton={
					<ButtonLink
						to="/app/settings/device-name"
						variant="text"
						sx={{ fontWeight: 400 }}
					>
						{t(m.editDeviceName)}
					</ButtonLink>
				}
				// TODO: What to do when this is undefined?
				label={deviceInfo.name || ''}
			/>

			<SettingRow
				icon={<Icon name="material-language" htmlColor={DARK_GREY} size={30} />}
				actionButton={
					<IconButtonLink to="/app/settings/language">
						<Icon name="material-chevron-right" />
					</IconButtonLink>
				}
				// TODO: Get displayed language name from settings
				label={'English'}
			/>

			<SettingRow
				icon={<Icon name="material-explore" htmlColor={DARK_GREY} size={30} />}
				actionButton={
					<IconButtonLink to="/app/settings/coordinate-system">
						<Icon name="material-chevron-right" />
					</IconButtonLink>
				}
				label={t(
					coordinateFormat === 'utm'
						? m.utmCoordinates
						: coordinateFormat === 'dd'
							? m.ddCoordinates
							: m.dmsCoordinates,
				)}
			/>

			<SettingRow
				icon={<Icon name="material-map" htmlColor={DARK_GREY} size={30} />}
				actionButton={
					<IconButtonLink to="/app/settings/background-map">
						<Icon name="material-chevron-right" />
					</IconButtonLink>
				}
				// TODO: Get background map name from settings
				label={t(m.defaultBackground)}
			/>
		</Stack>
	)
}

// TODO: Make whole thing clickable?
function SettingRow({
	actionButton,
	icon,
	label,
}: {
	actionButton: ReactNode
	icon: ReactNode
	label: string
}) {
	return (
		<Stack
			direction="row"
			justifyContent="space-between"
			border={`1px solid ${BLUE_GREY}`}
			borderRadius={2}
			padding={4}
		>
			<Stack
				direction="row"
				alignItems="center"
				useFlexGap
				gap={3}
				overflow="auto"
			>
				{icon}
				<Typography
					textOverflow="ellipsis"
					whiteSpace="nowrap"
					overflow="hidden"
					flex={1}
					fontWeight={500}
				>
					{label}
				</Typography>
			</Stack>
			{actionButton}
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.app.settings.index.title',
		defaultMessage: 'App Settings',
		description: 'Title of the settings page.',
	},
	description: {
		id: 'routes.app.settings.index.description',
		defaultMessage: 'CoMapeo is set to the following.',
		description: 'Description of the settings page.',
	},
	editDeviceName: {
		id: 'routes.app.settings.index.editDeviceName',
		defaultMessage: 'Edit',
		description: 'Button text for navigating to page to edit device name.',
	},
	defaultBackground: {
		id: 'routes.app.settings.index.defaultBackground',
		defaultMessage: 'Default Background',
		description: 'Name of the background map used if a custom one is not set.',
	},
	ddCoordinates: {
		id: 'routes.app.settings.index.decimalDegrees',
		defaultMessage: 'DD Coordinates',
		description: 'Label for Decimal Degrees coordinate system.',
	},
	utmCoordinates: {
		id: 'routes.app.settings.index.utmCoordinates',
		defaultMessage: 'UTM Coordinates',
		description: 'Label for Universal Transverse Mercator coordinate system.',
	},
	dmsCoordinates: {
		id: 'routes.app.settings.index.dmsCoordinates',
		defaultMessage: 'DMS Coordinates',
		description: 'Label for Degrees/Minutes/Seconds coordinate system.',
	},
})
