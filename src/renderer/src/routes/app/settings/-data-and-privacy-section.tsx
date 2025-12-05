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

import { BLUE_GREY, DARKER_ORANGE, DARK_GREY } from '#renderer/src/colors.ts'
import {
	ErrorDialog,
	type Props as ErrorDialogProps,
} from '#renderer/src/components/error-dialog.tsx'
import { Icon } from '#renderer/src/components/icon.tsx'
import { TextLink } from '#renderer/src/components/link.tsx'
import { useIconSizeBasedOnTypography } from '#renderer/src/hooks/icon.ts'
import {
	getDiagnosticsEnabledQueryOptions,
	setDiagnosticsEnabledMutationOptions,
} from '#renderer/src/lib/queries/app-settings.ts'
import { openExternalURLMutationOptions } from '#renderer/src/lib/queries/system.ts'

export function DataAndPrivacySection() {
	const { formatMessage: t } = useIntl()

	const setDiagnosticsEnabledMutation = useMutation(
		setDiagnosticsEnabledMutationOptions(),
	)

	const { data: diagnosticsEnabled } = useSuspenseQuery(
		getDiagnosticsEnabledQueryOptions(),
	)

	const openExternalURL = useMutation(openExternalURLMutationOptions())

	const errorDialogProps: ErrorDialogProps =
		setDiagnosticsEnabledMutation.status === 'error'
			? {
					open: true,
					errorMessage: setDiagnosticsEnabledMutation.error.toString(),
					onClose: () => {
						setDiagnosticsEnabledMutation.reset()
					},
				}
			: openExternalURL.status === 'error'
				? {
						open: true,
						errorMessage: openExternalURL.error.toString(),
						onClose: () => {
							openExternalURL.reset()
						},
					}
				: {
						open: false,
						onClose: () => {},
					}

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

				<Stack
					direction="column"
					border={`1px solid ${BLUE_GREY}`}
					borderRadius={2}
				>
					<Stack padding={6} direction="column" gap={4}>
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
			</Stack>

			<ErrorDialog {...errorDialogProps} />
		</>
	)
}

const PRIVACY_POLICY_URL =
	'https://digidem.notion.site/CoMapeo-Data-Privacy-d8f413bbbf374a2092655b89b9ceb2b0'

const m = defineMessages({
	title: {
		id: 'routes.app.settings.-data-and-privacy-section.title',
		defaultMessage: 'Data & Privacy',
	},
	description: {
		id: 'routes.app.settings.-data-and-privacy-section.description',
		defaultMessage: 'CoMapeo respects your privacy and autonomy',
	},
	learnMore: {
		id: 'routes.app.settings.-data-and-privacy-section.learnMore',
		defaultMessage: 'Learn More',
	},
	diagnosticInformationTitle: {
		id: 'routes.app.settings.-data-and-privacy-section.diagnosticInformationTitle',
		defaultMessage: 'Diagnostic Information',
	},
	diagnosticInformationDescription: {
		id: 'routes.app.settings.-data-and-privacy-section.diagnosticInformationDescription',
		defaultMessage:
			'Anonymized information about your device, app crashes, errors and performance helps Awana Digital improve the app and fix errors.',
	},
	diagnosticInformationPersonalInfo: {
		id: 'routes.app.settings.-data-and-pritvacy-section.diagnosticInformationPersonalInfo',
		defaultMessage:
			'This never includes any of your data or personal information. ',
	},
	diagnosticInformationOptOut: {
		id: 'routes.app.settings.-data-and-privacy-section.diagnosticInformationOptOut',
		defaultMessage:
			'You can opt-out of sharing diagnostic information at any time.',
	},
	shareDiagnosticInformation: {
		id: 'routes.app.settings.-data-and-privacy-section.shareDiagnosticInformation',
		defaultMessage: 'Share Diagnostic Information',
	},
})
