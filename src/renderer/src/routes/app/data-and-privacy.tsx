import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARKER_ORANGE, DARK_GREY, LIGHT_GREY } from '../../colors'
import { ErrorDialog } from '../../components/error-dialog'
import { Icon } from '../../components/icon'
import {
	getDiagnosticsEnabledQueryOptions,
	setDiagnosticsEnabledMutationOptions,
} from '../../lib/queries/app-settings'
import { openExternalURLMutationOptions } from '../../lib/queries/system'
import { TwoPanelLayout } from './-components/two-panel-layout'

export const Route = createFileRoute('/app/data-and-privacy')({
	loader: async ({ context }) => {
		const { queryClient } = context
		await queryClient.ensureQueryData(getDiagnosticsEnabledQueryOptions())
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const queryClient = Route.useRouteContext({
		select: ({ queryClient }) => queryClient,
	})

	const setDiagnosticsEnabledMutation = useMutation(
		setDiagnosticsEnabledMutationOptions(queryClient),
	)

	const { data: diagnosticsEnabled } = useSuspenseQuery(
		getDiagnosticsEnabledQueryOptions(),
	)

	const openExternalURL = useMutation(openExternalURLMutationOptions())

	const errorDialogProps =
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

	return (
		<>
			<TwoPanelLayout
				start={
					<Stack
						direction="column"
						gap={4}
						padding={6}
						flex={1}
						overflow="auto"
					>
						<Stack
							direction="column"
							border={`1px solid ${BLUE_GREY}`}
							borderRadius={2}
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

							<Button
								size="medium"
								variant="text"
								sx={{ fontWeight: 400 }}
								onClick={() => {
									openExternalURL.mutate(PRIVACY_POLICY_URL)
								}}
							>
								{t(m.learnMore)}
							</Button>
						</Stack>
						<Stack
							direction="column"
							border={`1px solid ${BLUE_GREY}`}
							borderRadius={2}
							flex={1}
						>
							<Stack padding={6} direction="column" gap={6} flex={1}>
								<Typography variant="h2" fontWeight={500}>
									{t(m.diagnosticInformationTitle)}
								</Typography>

								<Box>
									<Typography color="textSecondary">
										{t(m.diagnosticInformationDescription)}
									</Typography>

									<List
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

							<Divider
								variant="fullWidth"
								sx={{ backgroundColor: BLUE_GREY }}
							/>

							<Box paddingX={6} paddingY={4}>
								<FormGroup>
									<FormControlLabel
										control={<Checkbox checked={diagnosticsEnabled} />}
										onChange={(_event, checked) => {
											// TODO: Optimistic update?
											// TODO: Handle error?
											setDiagnosticsEnabledMutation.mutate(checked)
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
				}
				end={<Box bgcolor={LIGHT_GREY} display="flex" flex={1} />}
			/>

			<ErrorDialog {...errorDialogProps} />
		</>
	)
}

const PRIVACY_POLICY_URL =
	'https://digidem.notion.site/CoMapeo-Data-Privacy-d8f413bbbf374a2092655b89b9ceb2b0'

const m = defineMessages({
	title: {
		id: 'routes.app.data-and-privacy.title',
		defaultMessage: 'Data & Privacy',
	},
	description: {
		id: 'routes.app.data-and-privacy.description',
		defaultMessage: 'CoMapeo respects your privacy and autonomy',
	},
	learnMore: {
		id: 'routes.app.data-and-privacy.learnMore',
		defaultMessage: 'Learn More',
	},
	diagnosticInformationTitle: {
		id: 'routes.app.data-and-privacy.diagnosticInformationTitle',
		defaultMessage: 'Diagnostic Information',
	},
	diagnosticInformationDescription: {
		id: 'routes.app.data-and-privacy.diagnosticInformationDescription',
		defaultMessage:
			'Anonymized information about your device, app crashes, errors and performance helps Awana Digital improve the app and fix errors.',
	},
	diagnosticInformationPersonalInfo: {
		id: 'routes.app.data-and-privacy.diagnosticInformationPersonalInfo',
		defaultMessage:
			'This never includes any of your data or personal information. ',
	},
	diagnosticInformationOptOut: {
		id: 'routes.app.data-and-privacy.diagnosticInformationOptOut',
		defaultMessage:
			'You can opt-out of sharing diagnostic information at any time.',
	},
	shareDiagnosticInformation: {
		id: 'routes.app.data-and-privacy.shareDiagnosticInformation',
		defaultMessage: 'Share Diagnostic Information',
	},
})
