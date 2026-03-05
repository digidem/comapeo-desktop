import { Suspense } from 'react'
import { useMapStyleUrl, useOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { ListRowLink } from '../-components/list-row-link.tsx'
import { BLUE_GREY, DARKER_ORANGE, DARK_GREY } from '../../../colors.ts'
import { ErrorBoundary } from '../../../components/error-boundary.tsx'
import { Icon } from '../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../hooks/icon.ts'
import { getLanguageInfo } from '../../../lib/intl.ts'
import {
	getCoordinateFormatQueryOptions,
	getLocaleStateQueryOptions,
} from '../../../lib/queries/app-settings.ts'
import { getCustomMapInfoQueryOptions } from '../../../lib/queries/maps.ts'
import { DataAndPrivacySection } from './-data-and-privacy-section.tsx'

export const Route = createFileRoute('/app/settings/')({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const headerIconHeight = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 2,
	})

	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Stack direction="column" gap={6} padding={6}>
				<Stack direction="row" gap={4} alignItems="center" flex={1}>
					<Icon
						name="material-settings"
						size={headerIconHeight}
						htmlColor={DARKER_ORANGE}
					/>

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.title)}
					</Typography>
				</Stack>
			</Stack>

			<Box paddingInline={6}>
				<Divider variant="fullWidth" sx={{ borderColor: BLUE_GREY }} />
			</Box>

			<Box
				display="flex"
				flex={1}
				overflow="auto"
				padding={6}
				sx={{ scrollbarGutter: 'stable both-edges' }}
			>
				<Suspense
					fallback={
						<Box
							display="flex"
							flexDirection="column"
							alignItems="center"
							justifyContent="center"
							flex={1}
						>
							<CircularProgress disableShrink />
						</Box>
					}
				>
					<Container maxWidth="md" disableGutters>
						<Stack direction="column" gap={6}>
							<SettingsList />

							<DataAndPrivacySection />

							<AboutCoMapeoSection />
						</Stack>
					</Container>
				</Suspense>
			</Box>
		</Stack>
	)
}

function SettingsList() {
	const { formatMessage: t } = useIntl()

	const { data: deviceInfo } = useOwnDeviceInfo()

	const { data: coordinateFormat } = useSuspenseQuery(
		getCoordinateFormatQueryOptions(),
	)

	const { data: selectedLanguageName } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ source, value }) => {
			const match = getLanguageInfo(value)

			if (source === 'system') {
				return t(m.languageFromSystemPreference, { name: match.nativeName })
			}

			return match.nativeName
		},
	})

	const { data: styleUrl } = useMapStyleUrl()

	const startIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 1.25,
	})

	const actionIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 1.75,
	})

	return (
		<Stack direction="column" gap={4}>
			<Typography
				component="h2"
				variant="body2"
				sx={{ textTransform: 'uppercase' }}
			>
				{t(m.sectionTitleGeneral)}
			</Typography>

			<List disablePadding>
				<Box
					flex={1}
					display="grid"
					gridTemplateColumns={`1fr 1fr`}
					rowGap={6}
					columnGap={6}
				>
					<ListItem
						disableGutters
						disablePadding
						sx={{ display: 'flex', alignItems: 'stretch' }}
					>
						<ListRowLink
							to="/app/settings/device-name"
							start={
								<Icon
									name="material-symbols-computer"
									htmlColor={DARK_GREY}
									size={startIconSize}
								/>
							}
							end={
								<Typography color="primary">{t(m.editDeviceName)}</Typography>
							}
							aria-label={t(m.deviceNameSettingsAccessibleLabel)}
							// TODO: What to do when this is undefined?
							label={deviceInfo.name || ''}
						/>
					</ListItem>

					<ListItem
						disableGutters
						disablePadding
						sx={{ display: 'flex', alignItems: 'stretch' }}
					>
						<ListRowLink
							to="/app/settings/language"
							start={
								<Icon
									name="material-language"
									htmlColor={DARK_GREY}
									size={startIconSize}
								/>
							}
							end={
								<Icon
									name="material-chevron-right-rounded"
									htmlColor={DARK_GREY}
									size={actionIconSize}
								/>
							}
							aria-label={t(m.languageSettingsAccessibleLabel)}
							label={selectedLanguageName}
						/>
					</ListItem>

					<ListItem
						disableGutters
						disablePadding
						sx={{ display: 'flex', alignItems: 'stretch' }}
					>
						<ListRowLink
							to="/app/settings/coordinate-system"
							start={
								<Icon
									name="material-explore-filled"
									htmlColor={DARK_GREY}
									size={startIconSize}
								/>
							}
							end={
								<Icon
									name="material-chevron-right-rounded"
									htmlColor={DARK_GREY}
									size={actionIconSize}
								/>
							}
							aria-label={t(m.coordinateSystemSettingsAccessibleLabel)}
							label={t(
								coordinateFormat === 'utm'
									? m.utmCoordinates
									: coordinateFormat === 'dd'
										? m.ddCoordinates
										: m.dmsCoordinates,
							)}
						/>
					</ListItem>

					<ListItem
						disableGutters
						disablePadding
						sx={{ display: 'flex', alignItems: 'stretch' }}
					>
						<ListRowLink
							to="/app/settings/background-map"
							start={
								<Icon
									name="material-layers-outlined"
									htmlColor={DARK_GREY}
									size={startIconSize}
								/>
							}
							end={
								<Icon
									name="material-chevron-right-rounded"
									htmlColor={DARK_GREY}
									size={actionIconSize}
								/>
							}
							aria-label={t(m.backgroundMapSettingsAccessibleLabel)}
							label={
								<Suspense>
									<BackgroundMapLabel styleUrl={styleUrl} />
								</Suspense>
							}
						/>
					</ListItem>
				</Box>
			</List>
		</Stack>
	)
}

function BackgroundMapLabel({ styleUrl }: { styleUrl: string }) {
	const { formatMessage: t } = useIntl()

	return (
		<ErrorBoundary
			getResetKey={() => styleUrl}
			fallback={() => <>{t(m.customBackground)}</>}
		>
			<BackgroundMapText styleUrl={styleUrl} />
		</ErrorBoundary>
	)
}

function BackgroundMapText({ styleUrl }: { styleUrl: string }) {
	const { formatMessage: t } = useIntl()

	const customMapInfo = useSuspenseQuery(
		getCustomMapInfoQueryOptions({ styleUrl }),
	)

	if (customMapInfo.status === 'error') {
		return t(m.customBackground)
	}

	if (!customMapInfo.data) {
		return t(m.defaultBackground)
	}

	return customMapInfo.data.name
}

function AboutCoMapeoSection() {
	const { formatMessage: t } = useIntl()

	return (
		<Stack direction="column" gap={4}>
			<Stack direction="column" gap={4}>
				<Typography
					component="h2"
					variant="body2"
					sx={{ textTransform: 'uppercase' }}
				>
					{t(m.sectionTitleAboutCoMapeo)}
				</Typography>

				<Stack
					direction="column"
					border={`1px solid ${BLUE_GREY}`}
					borderRadius={2}
					gap={4}
					flex={1}
				>
					<List>
						<ListItem>
							<Stack direction="column" gap={3}>
								<Typography component="h3" variant="body1" fontWeight={500}>
									{t(m.aboutCoMapeoVersionLabel)}
								</Typography>

								<Typography>
									{window.runtime.getAppInfo().appVersion}
								</Typography>
							</Stack>
						</ListItem>
					</List>
				</Stack>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.app.settings.index.title',
		defaultMessage: 'CoMapeo Settings',
		description: 'Title of the settings page.',
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
	customBackground: {
		id: 'routes.app.settings.index.customBackground',
		defaultMessage: 'Custom Background',
		description:
			'Placeholder name of custom background map if name cannot be retrieved.',
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
	languageFromSystemPreference: {
		id: 'routes.app.settings.index.languageFromSystemPreference',
		defaultMessage: '{name} (System Preference)',
		description: 'Label for selected language based on the system preferences.',
	},
	deviceNameSettingsAccessibleLabel: {
		id: 'routes.app.settings.index.deviceNameSettingsAccessibleLabel',
		defaultMessage: 'Go to device name settings.',
		description:
			'Accessible label for link item that navigates to device name settings page.',
	},
	languageSettingsAccessibleLabel: {
		id: 'routes.app.settings.index.languageSettingsAccessibleLabel',
		defaultMessage: 'Go to language settings.',
		description:
			'Accessible label for link item that navigates to language settings page.',
	},
	coordinateSystemSettingsAccessibleLabel: {
		id: 'routes.app.settings.index.coordinateSystemSettingsAccessibleLabel',
		defaultMessage: 'Go to coordinate system settings.',
		description:
			'Accessible label for link item that navigates to coordinate system settings page.',
	},
	backgroundMapSettingsAccessibleLabel: {
		id: 'routes.app.settings.index.backgroundMapSettingsAccessibleLabel',
		defaultMessage: 'Go to background map settings.',
		description:
			'Accessible label for link item that navigates to background map settings page.',
	},
	sectionTitleGeneral: {
		id: 'routes.app.settings.index.sectionTitleGeneral',
		defaultMessage: 'General',
		description: 'Text for general settings section title',
	},
	sectionTitleAboutCoMapeo: {
		id: 'routes.app.settings.index.sectionTitleAboutCoMapeo',
		defaultMessage: 'About CoMapeo',
		description: 'Text for data and privacy section title',
	},
	aboutCoMapeoVersionLabel: {
		id: 'routes.app.settings.index.aboutCoMapeoVersionLabel',
		defaultMessage: 'CoMapeo Version',
		description: 'Label for CoMapeo version',
	},
})
