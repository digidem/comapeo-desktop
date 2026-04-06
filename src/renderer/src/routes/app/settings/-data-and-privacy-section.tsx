import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARKER_ORANGE, DARK_GREY } from '../../../colors.ts'
import { DecentDialog } from '../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../components/error-dialog.tsx'
import { Icon } from '../../../components/icon.tsx'
import { TextLink } from '../../../components/link.tsx'
import { useIconSizeBasedOnTypography } from '../../../hooks/icon.ts'
import {
	getAppUsageMetricsQueryOptions,
	getDiagnosticsEnabledQueryOptions,
	setAppUsageMetricsMutationOptions,
	setDiagnosticsEnabledMutationOptions,
} from '../../../lib/queries/app-settings.ts'
import { openExternalURLMutationOptions } from '../../../lib/queries/system.ts'

export function DataAndPrivacySection() {
	const { formatMessage: t } = useIntl()

	const { data: diagnosticsEnabled } = useSuspenseQuery(
		getDiagnosticsEnabledQueryOptions(),
	)
	const setDiagnosticsEnabledMutation = useMutation(
		setDiagnosticsEnabledMutationOptions(),
	)

	const { data: appUsageMetrics } = useSuspenseQuery(
		getAppUsageMetricsQueryOptions(),
	)
	const setAppUsageMetricsMutation = useMutation(
		setAppUsageMetricsMutationOptions(),
	)

	const openExternalURL = useMutation(openExternalURLMutationOptions())

	const iconSize = useIconSizeBasedOnTypography({
		multiplier: 2,
		typographyVariant: 'body1',
	})

	return (
		<>
			<Stack direction="column" gap={4}>
				<Typography
					component="h2"
					variant="body2"
					sx={{ textTransform: 'uppercase' }}
				>
					{t(m.title)}
				</Typography>

				<Stack
					direction="row"
					border={`1px solid ${BLUE_GREY}`}
					borderRadius={2}
					gap={4}
					padding={6}
				>
					<Icon
						name="material-symbols-encrypted-weight200"
						sx={{
							height: iconSize,
							width: iconSize,
						}}
						htmlColor={DARKER_ORANGE}
					/>

					<Stack direction="column" gap={2}>
						<Typography component="h3" variant="body1" fontWeight={500}>
							{t(m.description)}
						</Typography>

						<TextLink
							href={PRIVACY_POLICY_URL}
							onClick={(event) => {
								// NOTE: Kind of cursed but necessary
								event.preventDefault()

								openExternalURL.mutate(PRIVACY_POLICY_URL, {
									onError: (err) => {
										captureException(err)
									},
								})
							}}
							sx={{ textDecoration: 'none' }}
						>
							{t(m.learnMore)}
						</TextLink>
					</Stack>
				</Stack>

				<Stack direction="row" gap={6}>
					<Stack
						direction="column"
						border={`1px solid ${BLUE_GREY}`}
						borderRadius={2}
					>
						<Stack padding={6} direction="column" gap={4} flex={1}>
							<Typography component="h3" variant="body1" fontWeight={500}>
								{t(m.diagnosticInformationTitle)}
							</Typography>

							<Box>
								<Typography color="textSecondary">
									{t(m.diagnosticInformationDescription)}
								</Typography>

								<List
									disablePadding
									sx={{
										listStyleType: 'disc',
										paddingX: 8,
										color: DARK_GREY,
									}}
								>
									<ListItem disablePadding sx={{ display: 'list-item' }}>
										<Typography color="textSecondary">
											{t(m.diagnosticInformationPersonalInfo)}
										</Typography>
									</ListItem>

									<ListItem disablePadding sx={{ display: 'list-item' }}>
										<Typography color="textSecondary">
											{t(m.diagnosticInformationOptOut)}
										</Typography>
									</ListItem>
								</List>
							</Box>
						</Stack>

						<Divider variant="fullWidth" sx={{ backgroundColor: BLUE_GREY }} />

						<Box paddingX={6} paddingY={4}>
							<FormGroup>
								<FormControlLabel
									control={<Checkbox checked={diagnosticsEnabled} />}
									onChange={(_event, checked) => {
										setDiagnosticsEnabledMutation.mutate(checked, {
											onError: (err) => {
												captureException(err)
											},
										})
									}}
									slotProps={{
										typography: {
											fontWeight: 500,
										},
									}}
									label={t(m.shareDiagnosticInformation)}
									labelPlacement="start"
									sx={{
										margin: 0,
										justifyContent: 'space-between',
									}}
								/>
							</FormGroup>
						</Box>
					</Stack>

					<Stack
						direction="column"
						border={`1px solid ${BLUE_GREY}`}
						borderRadius={2}
					>
						<Stack padding={6} direction="column" gap={4} flex={1}>
							<Typography component="h3" variant="body1" fontWeight={500}>
								{t(m.appUsageTitle)}
							</Typography>

							<Box>
								<Typography color="textSecondary">
									{t(m.appUsageDescription)}
								</Typography>

								<List
									disablePadding
									sx={{
										listStyleType: 'disc',
										paddingX: 8,
										color: DARK_GREY,
									}}
								>
									<ListItem disablePadding sx={{ display: 'list-item' }}>
										<Typography color="textSecondary">
											{t(m.appUsageDetailsIdNumbers)}
										</Typography>
									</ListItem>

									<ListItem disablePadding sx={{ display: 'list-item' }}>
										<Typography color="textSecondary">
											{t(m.appUsageDetailsIpAddresses)}
										</Typography>
									</ListItem>
								</List>
							</Box>
						</Stack>

						<Divider variant="fullWidth" sx={{ backgroundColor: BLUE_GREY }} />

						<Box paddingX={6} paddingY={4}>
							<FormGroup>
								<FormControlLabel
									control={
										<Checkbox checked={appUsageMetrics?.status === 'enabled'} />
									}
									onChange={(_event, checked) => {
										setAppUsageMetricsMutation.mutate(
											{
												status: checked ? 'enabled' : 'disabled',
												shouldBumpAskCount: false,
											},
											{
												onError: (err) => {
													captureException(err)
												},
											},
										)
									}}
									slotProps={{
										typography: {
											fontWeight: 500,
										},
									}}
									label={t(m.shareAppUsage)}
									labelPlacement="start"
									sx={{
										margin: 0,
										justifyContent: 'space-between',
									}}
								/>
							</FormGroup>
						</Box>
					</Stack>
				</Stack>
			</Stack>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					setDiagnosticsEnabledMutation.status === 'error'
						? {
								errorMessage: setDiagnosticsEnabledMutation.error.toString(),
								onClose: () => {
									setDiagnosticsEnabledMutation.reset()
								},
							}
						: setAppUsageMetricsMutation.status === 'error'
							? {
									errorMessage: setAppUsageMetricsMutation.error.toString(),
									onClose: () => {
										setAppUsageMetricsMutation.reset()
									},
								}
							: openExternalURL.status === 'error'
								? {
										errorMessage: openExternalURL.error.toString(),
										onClose: () => {
											openExternalURL.reset()
										},
									}
								: null
				}
			>
				{({ errorMessage, onClose }) => (
					<ErrorDialogContent errorMessage={errorMessage} onClose={onClose} />
				)}
			</DecentDialog>
		</>
	)
}

const PRIVACY_POLICY_URL =
	'https://digidem.notion.site/CoMapeo-Data-Privacy-d8f413bbbf374a2092655b89b9ceb2b0'

const m = defineMessages({
	title: {
		id: 'routes.app.settings.-data-and-privacy-section.title',
		defaultMessage: 'Data & Privacy',
		description: 'Title for data and privacy section in settings page.',
	},
	description: {
		id: 'routes.app.settings.-data-and-privacy-section.description',
		defaultMessage: 'CoMapeo respects your privacy and autonomy',
		description: 'Description for data and privacy section in settings page.',
	},
	learnMore: {
		id: 'routes.app.settings.-data-and-privacy-section.learnMore',
		defaultMessage: 'Learn More',
		description:
			'Text for link that navigates to external URL for additional information info about data and privacy.',
	},
	diagnosticInformationTitle: {
		id: 'routes.app.settings.-data-and-privacy-section.diagnosticInformationTitle',
		defaultMessage: 'Diagnostic Information',
		description: 'Title for diagnostic information section in settings page.',
	},
	diagnosticInformationDescription: {
		id: 'routes.app.settings.-data-and-privacy-section.diagnosticInformationDescription',
		defaultMessage:
			'Anonymized information about your device, app crashes, errors and performance helps Awana Digital improve the app and fix errors.',
		description:
			'Description for diagnostic information section in settings page.',
	},
	diagnosticInformationPersonalInfo: {
		id: 'routes.app.settings.-data-and-privacy-section.diagnosticInformationPersonalInfo',
		defaultMessage:
			'This never includes any of your data or personal information.',
		description:
			'Details about personal info in diagnostic information section in settings page.',
	},
	diagnosticInformationOptOut: {
		id: 'routes.app.settings.-data-and-privacy-section.diagnosticInformationOptOut',
		defaultMessage:
			'You can opt-out of sharing diagnostic information at any time.',
		description:
			'Details about opting out in diagnostic information section in settings page.',
	},
	shareDiagnosticInformation: {
		id: 'routes.app.settings.-data-and-privacy-section.shareDiagnosticInformation',
		defaultMessage: 'Share Diagnostic Information',
		description:
			'Label for checkbox to toggle sharing of diagnostic information.',
	},
	appUsageTitle: {
		id: 'routes.app.settings.-data-and-privacy-section.appUsageTitle',
		defaultMessage: 'App Usage',
		description: 'Title of app usage metrics settings section.',
	},
	appUsageDescription: {
		id: 'routes.app.settings.-data-and-privacy-section.appUsageDescription',
		defaultMessage:
			'Share how you use CoMapeo with Awana Digital — no information you share can be used to track you.',
		description: 'Description of app usage metrics settings section.',
	},
	appUsageDetailsIdNumbers: {
		id: 'routes.app.settings.-data-and-privacy-section.appUsageDetailsIdNumbers',
		defaultMessage:
			'ID numbers are scrambled randomly and changed every month. ID numbers are scrambled randomly and changed every month.',
		description:
			'Text describing how IDs used for app usage metrics are used and generated.',
	},
	appUsageDetailsIpAddresses: {
		id: 'routes.app.settings.-data-and-privacy-section.appUsageDetailsIpAddresses',
		defaultMessage: 'CoMapeo never stores IP addresses.',
		description: 'Text describing how IP addresses are never stored.',
	},
	shareAppUsage: {
		id: 'routes.app.settings.-data-and-privacy-section.shareAppUsage',
		defaultMessage: 'Share App Usage',
		description: 'Text label for checkbox to toggle app usage sharing setting.',
	},
})
