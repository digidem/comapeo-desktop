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

import { BLUE_GREY, DARKER_ORANGE, DARK_GREY } from '../../../../colors.ts'
import { DecentDialog } from '../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../components/error-dialog.tsx'
import { Icon } from '../../../../components/icon.tsx'
import { TextLink } from '../../../../components/link.tsx'
import { useIconSizeBasedOnTypography } from '../../../../hooks/icon.ts'
import {
	getAppUsageMetricsQueryOptions,
	getDiagnosticsEnabledQueryOptions,
	setAppUsageMetricsMutationOptions,
	setDiagnosticsEnabledMutationOptions,
} from '../../../../lib/queries/app-settings.ts'
import { openExternalURLMutationOptions } from '../../../../lib/queries/system.ts'

const PRIVACY_POLICY_URL =
	'https://digidem.notion.site/CoMapeo-Data-Privacy-d8f413bbbf374a2092655b89b9ceb2b0'

export function DataAndPrivacySection() {
	const intl = useIntl()

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
			<Stack component="section" direction="column" sx={{ gap: 4 }}>
				<Stack
					direction="row"
					sx={{
						border: `1px solid ${BLUE_GREY}`,
						borderRadius: 2,
						gap: 4,
						padding: 6,
					}}
				>
					<Icon
						name="material-symbols-encrypted-weight200"
						sx={{ height: iconSize, width: iconSize }}
						htmlColor={DARKER_ORANGE}
					/>

					<Stack direction="column" sx={{ alignItems: 'flex-start', gap: 4 }}>
						<Typography component="h2" variant="h3" sx={{ fontWeight: 500 }}>
							{intl.formatMessage(m.dataAndPrivacyDescription)}
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
							{intl.formatMessage(m.dataAndPrivacyLearnMore)}
						</TextLink>
					</Stack>
				</Stack>

				<Stack direction="row" sx={{ gap: 6 }}>
					<Stack
						component="section"
						direction="column"
						sx={{ flex: 1, border: `1px solid ${BLUE_GREY}`, borderRadius: 2 }}
					>
						<Stack direction="column" sx={{ padding: 6, gap: 2, flex: 1 }}>
							<Typography
								component="h3"
								variant="body1"
								sx={{ fontWeight: 500, textTransform: 'uppercase' }}
							>
								{intl.formatMessage(m.dataAndPrivacyDiagnosticInformationTitle)}
							</Typography>

							<Box>
								<Typography color="textSecondary">
									{intl.formatMessage(
										m.dataAndPrivacyDiagnosticInformationDescription,
									)}
								</Typography>

								<List
									disablePadding
									sx={{ listStyleType: 'disc', paddingX: 8, color: DARK_GREY }}
								>
									<ListItem disablePadding sx={{ display: 'list-item' }}>
										<Typography color="textSecondary">
											{intl.formatMessage(
												m.dataAndPrivacyDiagnosticInformationPersonalInfo,
											)}
										</Typography>
									</ListItem>

									<ListItem disablePadding sx={{ display: 'list-item' }}>
										<Typography color="textSecondary">
											{intl.formatMessage(
												m.dataAndPrivacyDiagnosticInformationOptOut,
											)}
										</Typography>
									</ListItem>
								</List>
							</Box>
						</Stack>

						<Divider variant="fullWidth" sx={{ backgroundColor: BLUE_GREY }} />

						<Box sx={{ paddingX: 6, paddingY: 4 }}>
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
									label={intl.formatMessage(
										m.dataAndPrivacyShareDiagnosticInformation,
									)}
									labelPlacement="start"
									sx={{ margin: 0, justifyContent: 'space-between' }}
								/>
							</FormGroup>
						</Box>
					</Stack>

					<Stack
						component="section"
						direction="column"
						sx={{ flex: 1, border: `1px solid ${BLUE_GREY}`, borderRadius: 2 }}
					>
						<Stack direction="column" sx={{ padding: 6, gap: 2, flex: 1 }}>
							<Typography
								component="h3"
								variant="body1"
								sx={{ fontWeight: 500, textTransform: 'uppercase' }}
							>
								{intl.formatMessage(m.dataAndPrivacyAppUsageTitle)}
							</Typography>

							<Box>
								<Typography color="textSecondary">
									{intl.formatMessage(m.dataAndPrivacyAppUsageDescription)}
								</Typography>

								<List
									disablePadding
									sx={{ listStyleType: 'disc', paddingX: 8, color: DARK_GREY }}
								>
									<ListItem disablePadding sx={{ display: 'list-item' }}>
										<Typography color="textSecondary">
											{intl.formatMessage(
												m.dataAndPrivacyAppUsageDetailsIdNumbers,
											)}
										</Typography>
									</ListItem>

									<ListItem disablePadding sx={{ display: 'list-item' }}>
										<Typography color="textSecondary">
											{intl.formatMessage(
												m.dataAndPrivacyAppUsageDetailsIpAddresses,
											)}
										</Typography>
									</ListItem>
								</List>
							</Box>
						</Stack>

						<Divider variant="fullWidth" sx={{ backgroundColor: BLUE_GREY }} />

						<Box sx={{ paddingX: 6, paddingY: 4 }}>
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
									label={intl.formatMessage(m.dataAndPrivacyShareAppUsage)}
									labelPlacement="start"
									sx={{ margin: 0, justifyContent: 'space-between' }}
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

const m = defineMessages({
	dataAndPrivacyDescription: {
		id: '$1.routes.app.settings.index.dataAndPrivacyDescription',
		defaultMessage: 'CoMapeo respects your privacy and autonomy',
		description: 'Description for data and privacy section in settings page.',
	},
	dataAndPrivacyLearnMore: {
		id: '$1.routes.app.settings.index.dataAndPrivacyLearnMore',
		defaultMessage: 'Learn More',
		description:
			'Text for link that navigates to external URL for additional information info about data and privacy.',
	},
	dataAndPrivacyDiagnosticInformationTitle: {
		id: '$1.routes.app.settings.index.dataAndPrivacyDiagnosticInformationTitle',
		defaultMessage: 'Diagnostic Information',
		description: 'Title for diagnostic information section in settings page.',
	},
	dataAndPrivacyDiagnosticInformationDescription: {
		id: '$1.routes.app.settings.index.dataAndPrivacyDiagnosticInformationDescription',
		defaultMessage:
			'Anonymized information about your device, app crashes, errors and performance helps Awana Digital improve the app and fix errors.',
		description:
			'Description for diagnostic information section in settings page.',
	},
	dataAndPrivacyDiagnosticInformationPersonalInfo: {
		id: '$1.routes.app.settings.index.dataAndPrivacyDiagnosticInformationPersonalInfo',
		defaultMessage:
			'This never includes any of your data or personal information.',
		description:
			'Details about personal info in diagnostic information section in settings page.',
	},
	dataAndPrivacyDiagnosticInformationOptOut: {
		id: '$1.routes.app.settings.index.dataAndPrivacyDiagnosticInformationOptOut',
		defaultMessage:
			'You can opt-out of sharing diagnostic information at any time.',
		description:
			'Details about opting out in diagnostic information section in settings page.',
	},
	dataAndPrivacyShareDiagnosticInformation: {
		id: '$1.routes.app.settings.index.dataAndPrivacyShareDiagnosticInformation',
		defaultMessage: 'Share Diagnostic Information',
		description:
			'Label for checkbox to toggle sharing of diagnostic information.',
	},
	dataAndPrivacyAppUsageTitle: {
		id: '$1.routes.app.settings.index.dataAndPrivacyAppUsageTitle',
		defaultMessage: 'App Usage',
		description: 'Title of app usage metrics settings section.',
	},
	dataAndPrivacyAppUsageDescription: {
		id: '$1.routes.app.settings.index.dataAndPrivacyAppUsageDescription',
		defaultMessage:
			'Share how you use CoMapeo with Awana Digital — no information you share can be used to track you.',
		description: 'Description of app usage metrics settings section.',
	},
	dataAndPrivacyAppUsageDetailsIdNumbers: {
		id: '$1.routes.app.settings.index.dataAndPrivacyAppUsageDetailsIdNumbers',
		defaultMessage:
			'ID numbers are scrambled randomly and changed every month.',
		description:
			'Text describing how IDs used for app usage metrics are used and generated.',
	},
	dataAndPrivacyAppUsageDetailsIpAddresses: {
		id: '$1.routes.app.settings.index.dataAndPrivacyAppUsageDetailsIpAddresses',
		defaultMessage: 'CoMapeo never stores IP addresses.',
		description: 'Text describing how IP addresses are never stored.',
	},
	dataAndPrivacyShareAppUsage: {
		id: '$1.routes.app.settings.index.dataAndPrivacyShareAppUsage',
		defaultMessage: 'Share App Usage',
		description: 'Text label for checkbox to toggle app usage sharing setting.',
	},
})
