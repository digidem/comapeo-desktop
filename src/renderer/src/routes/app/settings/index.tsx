import { Suspense, type ReactNode } from 'react'
import { useMapStyleUrl, useOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARKER_ORANGE, DARK_GREY } from '#renderer/src/colors.ts'
import { ErrorBoundary } from '#renderer/src/components/error-boundary.tsx'
import { Icon } from '#renderer/src/components/icon.tsx'
import {
	ListItemButtonLink,
	type ListItemButtonLinkComponentProps,
} from '#renderer/src/components/link.tsx'
import { useIconSizeBasedOnTypography } from '#renderer/src/hooks/icon.ts'
import { getLanguageInfo } from '#renderer/src/lib/intl.ts'
import {
	getCoordinateFormatQueryOptions,
	getLocaleStateQueryOptions,
} from '#renderer/src/lib/queries/app-settings.ts'
import { getCustomMapInfoQueryOptions } from '#renderer/src/lib/queries/maps.ts'

import { DataAndPrivacySection } from './-data-and-privacy-section.tsx'

export const Route = createFileRoute('/app/settings/')({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	return (
		<Stack direction="column" padding={6} flex={1} overflow="auto" gap={10}>
			<Stack direction="column" gap={4} alignItems="center">
				<Icon name="material-settings" size={120} htmlColor={DARKER_ORANGE} />

				<Typography variant="h1" fontWeight={500} textAlign="center">
					{t(m.title)}
				</Typography>
			</Stack>

			<Suspense
				fallback={
					<Box display="flex" flexDirection="row" justifyContent="center">
						<CircularProgress disableShrink />
					</Box>
				}
			>
				<SettingsList />

				<DataAndPrivacySection />

				<AboutCoMapeoSection />
			</Suspense>
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

	const rowIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 1.25,
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

			<List
				disablePadding
				sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
			>
				<ListItem disableGutters disablePadding>
					<SettingLink
						to="/app/settings/device-name"
						start={
							<Icon
								name="material-symbols-computer"
								htmlColor={DARK_GREY}
								size={rowIconSize}
							/>
						}
						end={<Typography color="primary">{t(m.editDeviceName)}</Typography>}
						aria-label={t(m.deviceNameSettingsAccessibleLabel)}
						// TODO: What to do when this is undefined?
						label={deviceInfo.name || ''}
					/>
				</ListItem>

				<ListItem disableGutters disablePadding>
					<SettingLink
						to="/app/settings/language"
						start={
							<Icon
								name="material-language"
								htmlColor={DARK_GREY}
								size={rowIconSize}
							/>
						}
						end={
							<Icon
								name="material-chevron-right"
								htmlColor={DARK_GREY}
								size={rowIconSize}
							/>
						}
						aria-label={t(m.languageSettingsAccessibleLabel)}
						label={selectedLanguageName}
					/>
				</ListItem>

				<ListItem disableGutters disablePadding>
					<SettingLink
						to="/app/settings/coordinate-system"
						start={
							<Icon
								name="material-explore-filled"
								htmlColor={DARK_GREY}
								size={rowIconSize}
							/>
						}
						end={
							<Icon
								name="material-chevron-right"
								htmlColor={DARK_GREY}
								size={rowIconSize}
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

				<ListItem disableGutters disablePadding>
					<SettingLink
						to="/app/settings/background-map"
						start={
							<Icon
								name="material-layers-outlined"
								htmlColor={DARK_GREY}
								size={rowIconSize}
							/>
						}
						end={
							<Icon
								name="material-chevron-right"
								htmlColor={DARK_GREY}
								size={rowIconSize}
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

				{__APP_TYPE__ !== 'production' &&
				import.meta.env.VITE_FEATURE_TEST_DATA_UI === 'true' ? (
					<ListItem disableGutters disablePadding>
						<SettingLink
							to="/app/settings/test-data"
							start={
								<Icon
									name="material-auto-fix-high"
									htmlColor={DARK_GREY}
									size={rowIconSize}
								/>
							}
							end={
								<Icon
									name="material-chevron-right"
									htmlColor={DARK_GREY}
									size={rowIconSize}
								/>
							}
							label={t(m.createTestData)}
						/>
					</ListItem>
				) : null}
			</List>
		</Stack>
	)
}

function SettingLink({
	label,
	start,
	end,
	...linkProps
}: Pick<ListItemButtonLinkComponentProps, 'to' | 'params'> & {
	label: ReactNode
	start: ReactNode
	end: ReactNode
}) {
	return (
		<ListItemButtonLink
			{...linkProps}
			disableGutters
			disableTouchRipple
			sx={{ borderRadius: 2, border: `1px solid ${BLUE_GREY}` }}
		>
			<Stack
				direction="row"
				flex={1}
				justifyContent="space-between"
				alignItems="center"
				overflow="auto"
				padding={4}
			>
				<Stack direction="row" alignItems="center" gap={3} overflow="auto">
					{start}

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

				{end}
			</Stack>
		</ListItemButtonLink>
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
	createTestData: {
		id: 'routes.app.settings.index.createTestData',
		defaultMessage: 'Create Test Data',
		description: 'Label for item that navigates to test data creation page.',
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
