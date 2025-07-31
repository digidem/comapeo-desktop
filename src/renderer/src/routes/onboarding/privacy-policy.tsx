import { useState, type PropsWithChildren, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Collapse from '@mui/material/Collapse'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARK_GREY, LIGHT_GREY, WHITE } from '../../colors'
import { ErrorDialog } from '../../components/error-dialog'
import { Icon } from '../../components/icon'
import {
	getDiagnosticsEnabledQueryOptions,
	setDiagnosticsEnabledMutationOptions,
} from '../../lib/queries/app-settings'

export const Route = createFileRoute('/onboarding/privacy-policy')({
	loader: async ({ context }) => {
		const { queryClient } = context
		await queryClient.ensureQueryData(getDiagnosticsEnabledQueryOptions())
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const queryClient = useQueryClient()

	const setDiagnosticsEnabledMutation = useMutation(
		setDiagnosticsEnabledMutationOptions(queryClient),
	)

	const { data: diagnosticsEnabled } = useSuspenseQuery(
		getDiagnosticsEnabledQueryOptions(),
	)

	return (
		<>
			<Stack
				display="flex"
				useFlexGap
				direction="column"
				justifyContent="space-between"
				flex={1}
				gap={10}
				paddingX={5}
				paddingY={10}
				borderRadius={2}
				bgcolor={WHITE}
				overflow="auto"
			>
				<Container
					component={Stack}
					maxWidth="sm"
					direction="column"
					useFlexGap
					gap={10}
				>
					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.title)}
					</Typography>

					<Stack direction="column" useFlexGap gap={3}>
						<Box
							border={`1px solid ${BLUE_GREY}`}
							bgcolor={LIGHT_GREY}
							borderRadius={2}
							padding={5}
						>
							<Typography variant="body1" fontWeight={400}>
								{t(m.description)}
							</Typography>
						</Box>

						<CustomAccordion
							label={t(m.aboutAwanaDigital)}
							description={t(m.aboutAwanaDigitalDescription)}
						/>

						<CustomAccordion
							label={t(m.openSource)}
							description={t(m.openSourceDescription)}
						/>
					</Stack>

					<Stack useFlexGap direction="column" gap={10}>
						<Typography variant="h2" fontWeight={500}>
							{t(m.comapeoDataPrivacy)}
						</Typography>

						<QuestionAnswerItem
							icon={<Icon name="openmoji-red-circle" />}
							title={t(m.privateByDefault)}
							description={t(m.privateByDefaultDescription)}
						/>

						<QuestionAnswerItem
							icon={<Icon name="openmoji-bust-in-silhouette" />}
							title={t(m.noPII)}
							description={t(m.noPIIDescription)}
						/>

						<QuestionAnswerItem
							icon={<Icon name="openmoji-locked-with-key" />}
							title={t(m.control)}
							description={t(m.controlDescription)}
						/>

						<Divider sx={{ backgroundColor: BLUE_GREY }} />

						<Typography variant="h2" fontWeight={500}>
							{t(m.dataCollection)}
						</Typography>

						<QuestionAnswerItem
							icon={<Icon name="openmoji-bar-chart" />}
							title={t(m.whatIsCollected)}
							description={t(m.whatIsCollectedDescription)}
						>
							<Stack
								border={`1px solid ${BLUE_GREY}`}
								borderRadius={2}
								direction="column"
								useFlexGap
								gap={5}
								paddingY={5}
							>
								<Stack
									component="section"
									useFlexGap
									direction="column"
									paddingX={5}
									gap={3}
								>
									<Typography variant="h3">{t(m.diagnostics)}</Typography>

									<List
										sx={{
											listStyleType: 'disc',
											paddingX: 8,
											color: DARK_GREY,
										}}
									>
										<ListItem sx={{ display: 'list-item' }} disablePadding>
											{t(m.crashData)}
										</ListItem>

										<ListItem sx={{ display: 'list-item' }} disablePadding>
											{t(m.appErrors)}
										</ListItem>

										<ListItem sx={{ display: 'list-item' }} disablePadding>
											{t(m.performanceData)}
										</ListItem>

										<ListItem sx={{ display: 'list-item' }} disablePadding>
											{t(m.deviceInfo)}
										</ListItem>

										<ListItem sx={{ display: 'list-item' }} disablePadding>
											{t(m.appInfo)}
										</ListItem>
									</List>
								</Stack>

								<Divider sx={{ backgroundColor: BLUE_GREY }} />

								<Stack
									component="section"
									direction="column"
									useFlexGap
									paddingX={5}
									gap={3}
								>
									<Typography variant="h3">{t(m.appUsage)}</Typography>

									<List
										sx={{
											listStyleType: 'disc',
											paddingX: 8,
											color: DARK_GREY,
										}}
									>
										<ListItem sx={{ display: 'list-item' }} disablePadding>
											{t(m.country)}
										</ListItem>
									</List>
								</Stack>
							</Stack>
						</QuestionAnswerItem>

						<QuestionAnswerItem
							icon={<Icon name="openmoji-wrench" />}
							title={t(m.whyIsThisDataCollected)}
							description={t(m.whyIsThisDataCollectedDescription)}
						/>

						<QuestionAnswerItem
							icon={<Icon name="openmoji-raised-hand-medium-skin-tone" />}
							title={t(m.whatIsNotCollected)}
							description={t(m.whatIsNotCollectedDescription)}
						/>

						<Divider sx={{ backgroundColor: BLUE_GREY }} />

						<Typography variant="h2" fontWeight={500}>
							{t(m.dataCollection)}
						</Typography>

						<Stack
							border={`1px solid ${BLUE_GREY}`}
							borderRadius={2}
							direction="column"
							useFlexGap
							gap={5}
							padding={5}
						>
							<FormGroup>
								<FormControlLabel
									control={<Checkbox checked={diagnosticsEnabled} />}
									onChange={(_event, checked) => {
										// TODO: Handle error and report to Sentry
										setDiagnosticsEnabledMutation.mutate(checked)
									}}
									label={t(m.shareDiagnosticInformation)}
									labelPlacement="start"
									sx={{
										margin: 0,
										justifyContent: 'space-between',
									}}
								/>
							</FormGroup>
						</Stack>
					</Stack>
				</Container>
			</Stack>

			<ErrorDialog
				open={setDiagnosticsEnabledMutation.status === 'error'}
				errorMessage={setDiagnosticsEnabledMutation.error?.toString()}
				onClose={() => {
					setDiagnosticsEnabledMutation.reset()
				}}
			/>
		</>
	)
}

function QuestionAnswerItem({
	children,
	description,
	icon,
	title,
}: PropsWithChildren<{
	description: string
	icon: ReactNode
	title: string
}>) {
	return (
		<Stack component="section" useFlexGap direction="column" gap={10}>
			<Stack direction="row" alignItems="center" useFlexGap gap={2}>
				{icon}
				<Typography variant="h3">{title}</Typography>
			</Stack>

			<Typography sx={{ color: DARK_GREY }}>{description}</Typography>

			{children}
		</Stack>
	)
}

function CustomAccordion({
	label,
	description,
}: {
	label: string
	description: string
}) {
	const [expanded, setExpanded] = useState(false)

	return (
		<Stack
			borderRadius={2}
			border={`1px solid ${BLUE_GREY}`}
			paddingX={5}
			paddingY={2}
		>
			<Stack
				display="flex"
				direction="row"
				justifyContent="space-between"
				alignItems="center"
			>
				<Typography>{label}</Typography>

				<IconButton
					disableTouchRipple
					onClick={() => {
						setExpanded((prev) => !prev)
					}}
				>
					<Icon
						name={expanded ? 'material-expand-less' : 'material-expand-more'}
						sx={{ color: BLUE_GREY, fontSize: `4rem` }}
					/>
				</IconButton>
			</Stack>
			<Collapse in={expanded}>
				<Box paddingBottom={5}>
					<Typography sx={{ color: DARK_GREY }}>{description}</Typography>
				</Box>
			</Collapse>
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.onboarding.privacy-policy.title',
		defaultMessage: 'Privacy Policy',
	},
	description: {
		id: 'routes.onboarding.privacy-policy.description',
		defaultMessage:
			'The following explains what information (or "data") is sent from CoMapeo to the application developer, Awana Digital, and how that information is used.',
	},
	aboutAwanaDigital: {
		id: 'routes.onboarding.privacy-policy.aboutAwanaDigital',
		defaultMessage: 'About Awana Digital',
	},
	aboutAwanaDigitalDescription: {
		id: 'routes.onboarding.privacy-policy.aboutAwanaDigitalDescription',
		defaultMessage:
			'CoMapeo is developed by Awana Digital, a 501c3 non-profit organization registered in the United States. Awana Digital works in solidarity with frontline communities to use technology to defend their rights and fight climate change.',
	},
	openSource: {
		id: 'routes.onboarding.privacy-policy.openSource',
		defaultMessage: 'Open Source and the "Official" Version',
	},
	openSourceDescription: {
		id: 'routes.onboarding.privacy-policy.openSourceDescription',
		defaultMessage:
			'CoMapeo is an open-source application.<br></br><br></br>This means that anyone can view the code that makes the app work and can verify the privacy declarations in this document. It also means that anyone can adapt the app to their own needs and release an alternative version.<br></br><br></br>This document refers to data collected by the official releases of CoMapeo, digitally signed by Awana Digital, available from the Google Play Store or the Awana Digital website.<br></br><br></br>Unofficial releases of CoMapeo obtained from other channels are outside our control and may share additional information with other organizations.',
	},
	comapeoDataPrivacy: {
		id: 'routes.onboarding.privacy-policy.comapeoDataPrivacy',
		defaultMessage: 'CoMapeo Data Privacy',
	},
	privateByDefault: {
		id: 'routes.onboarding.privacy-policy.prviateByDefault',
		defaultMessage: 'Private by default',
	},
	privateByDefaultDescription: {
		id: 'routes.onboarding.privacy-policy.prviateByDefaultDescription',
		defaultMessage:
			"The data you collect and create with CoMapeo (locations, photos, video, audio, text) is only stored on your device by default, and is not stored or sent anywhere else.<br></br><br></br>When you share data with collaborators by joining a project with them, it is sent encrypted, directly to you collaborators' device. This means that the data is not sent via Awana Digital, nor anyone else, on its way to your collaborator.<br></br><br></br>Awana Digital never sees nor has access to any of the data you collect with CoMapeo unless you explicitly send it to us.",
	},
	noPII: {
		id: 'routes.onboarding.privacy-policy.noPII',
		defaultMessage: 'No personally identifiable information',
	},
	noPIIDescription: {
		id: 'routes.onboarding.privacy-policy.noPIIDescription',
		defaultMessage:
			'Using CoMapeo does not require a user account.<br></br><br></br>Awana Digital does not collect your name, email address or any other personal details.<br></br><br></br>No permanent user identifier or device identifier is ever shared with Awana Digital, and we take extra measures to ensure that no information you share can be used to track you: identifiers are randomized and rotated (changed) every month and we do not store IP addresses.',
	},
	control: {
		id: 'routes.onboarding.privacy-policy.control',
		defaultMessage: "You're in control",
	},
	controlDescription: {
		id: 'routes.onboarding.privacy-policy.controlDescription',
		defaultMessage:
			'You can opt out of sending any information to Awana Digital.<br></br><br></br>You choose where your data is stored and who it is shared with. You may choose to share anonymized, summarized data about how you use CoMapeo with Awana Digital.<br></br><br></br>We will always be transparent about what information you choose to share for the purpose of improving the app, and this information will never include photos, videos, audio, text, or precise locations that you have entered into CoMapeo.',
	},
	dataCollection: {
		id: 'routes.onboarding.privacy-policy.dataCollection',
		defaultMessage: 'CoMapeo Data Collection',
	},
	whatIsCollected: {
		id: 'routes.onboarding.privacy-policy.whatIsCollected',
		defaultMessage: 'What is collected?',
	},
	whatIsCollectedDescription: {
		id: 'routes.onboarding.privacy-policy.whatIsCollectedDescription',
		defaultMessage:
			'By default, anonymized diagnostic information about your device, app crashes, errors and performance is shared with Awana Digital.<br></br><br></br>You can opt-out of sharing this information at any time. This diagnostic information is completely anonymized and it never contains any of your data (the data you have collected with CoMapeo).',
	},
	diagnostics: {
		id: 'routes.onboarding.privacy-policy.diagnostics',
		defaultMessage: 'Diagnostics',
	},
	crashData: {
		id: 'routes.onboarding.privacy-policy.crashData',
		defaultMessage:
			'<b>Crash data</b>: Information about what caused the app to close unexpectedly.',
	},
	appErrors: {
		id: 'routes.onboarding.privacy-policy.appErrors',
		defaultMessage:
			'<b>App Errors</b>: Information about internal errors that result in the app to not function as expected.',
	},
	performanceData: {
		id: 'routes.onboarding.privacy-policy.performanceData',
		defaultMessage:
			'<b>Performance Data</b>: Such as launch time, energy usage, app freezes, and responsiveness.',
	},
	deviceInfo: {
		id: 'routes.onboarding.privacy-policy.deviceInfo',
		defaultMessage:
			'<b>Device Info</b>: Such as model and manufacturer of your device; device operating system; screen size; device locale (language); device memory.',
	},
	appInfo: {
		id: 'routes.onboarding.privacy-policy.appInfo',
		defaultMessage:
			'<b>App Info</b>: The version and locale (language) of CoMapeo.',
	},
	appUsage: {
		id: 'routes.onboarding.privacy-policy.appUsage',
		defaultMessage: 'App Usage',
	},
	country: {
		id: 'routes.onboarding.privacy-policy.country',
		defaultMessage: '<b>Country</b>: The country where CoMapeo is being used.',
	},
	whyIsThisDataCollected: {
		id: 'routes.onboarding.privacy-policy.whyIsThisDataCollected',
		defaultMessage: 'Why is this data collected?',
	},
	whyIsThisDataCollectedDescription: {
		id: 'routes.onboarding.privacy-policy.whyIsThisDataCollectedDescription',
		defaultMessage:
			'Crash data and app errors together with the device and app info provide Awana Digital with the information we need to fix errors and bugs in the app.<br></br><br></br>The performance data helps us improve the responsiveness of the app and identify errors.<br></br><br></br>The country where CoMapeo is being used and the language of the UI helps us understand minimal information about CoMapeo users: "How many CoMapeo users are there in each country?"',
	},
	whatIsNotCollected: {
		id: 'routes.onboarding.privacy-policy.whatIsNotCollected',
		defaultMessage: 'What is not collected?',
	},
	whatIsNotCollectedDescription: {
		id: 'routes.onboarding.privacy-policy.whatIsNotCollectedDescription',
		defaultMessage:
			'We do not collect any personal data or anything that can be used to identify or track a user or device. Device identifiers used to aggregate information are random, anonymous, and changed every month. Diagnostic information does not include data about how you use the app, and it never includes any of the data you have collected with the app. We do not collect your precise or coarse location, only the country where you are using CoMapeo.',
	},
	currentPermission: {
		id: 'routes.onboarding.privacy-policy.currentPermissions',
		defaultMessage: 'Current Permissions',
	},
	shareDiagnosticInformation: {
		id: 'routes.onboarding.privacy-policy.shareDiagnosticInformation',
		defaultMessage: 'Share Diagnostic Information',
	},
})
