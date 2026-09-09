import { useEffect, useId, type ReactNode } from 'react'
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Container,
	LinearProgress,
	List,
	Stack,
	Typography,
} from '@mui/material'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { keyframes } from '@mui/material/styles'
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARKER_ORANGE, GREEN, WHITE } from '../../colors.ts'
import { AdvancedErrorDetails } from '../../components/advanced-error-details.tsx'
import { Icon } from '../../components/icon.tsx'
import { bytesToMegabytes } from '../../lib/bytes-to-megabytes.ts'
import { ExhaustivenessError } from '../../lib/exhaustiveness-error.ts'
import { buildDocumentReloadURL } from '../../lib/navigation.ts'
import { openSystemSettingsMutationOptions } from '../../lib/queries/system.ts'
import {
	getMigrationStatusQueryOptions,
	retryMigrationMutationOptions,
} from '../../lib/queries/user.ts'

export const Route = createFileRoute('/migration/')({
	component: RouteComponent,
})

function RouteComponent() {
	const queryClient = useQueryClient()

	const { data: migrationStatus } = useSuspenseQuery(
		getMigrationStatusQueryOptions(),
	)

	useEffect(() => {
		const unsubscribe = window.runtime.onMigrationStatusUpdate((status) => {
			queryClient.setQueryData(
				getMigrationStatusQueryOptions().queryKey,
				status,
			)
		})

		return () => {
			unsubscribe()
		}
	}, [queryClient])

	let panel: React.JSX.Element

	const status = migrationStatus.type

	switch (status) {
		case 'progress': {
			panel = (
				<InProgressPanel
					current={migrationStatus.current}
					total={migrationStatus.total}
				/>
			)

			break
		}
		case 'error:needs_space': {
			panel = <NeedsSpacePanel spaceNeeded={migrationStatus.spaceNeeded} />
			break
		}
		case 'error': {
			panel = (
				<ErrorPanel
					current={migrationStatus.current}
					error={migrationStatus.error}
					total={migrationStatus.total}
				/>
			)
			break
		}
		case 'done': {
			panel = <SuccessPanel />
			break
		}
		default: {
			throw new ExhaustivenessError(status)
		}
	}

	return (
		<Box
			sx={{ bgcolor: WHITE, display: 'flex', height: '100%', overflow: 'auto' }}
		>
			<Container disableGutters maxWidth="sm" sx={{ display: 'flex', flex: 1 }}>
				{panel}
			</Container>
		</Box>
	)
}

function ErrorPanel({
	error,
	current,
	total,
}: {
	current: number
	error: Error
	total: number
}) {
	const intl = useIntl()

	const progressId = useId()

	const retryMigration = useMutation(retryMigrationMutationOptions())

	return (
		<MigrationPanelLayout
			actions={
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'center',
					}}
				>
					<Button
						fullWidth
						variant="contained"
						loading={retryMigration.status === 'pending'}
						onClick={() => {
							if (retryMigration.status === 'pending') {
								return
							}

							retryMigration.mutate()
						}}
						sx={{ maxWidth: 400 }}
					>
						{intl.formatMessage(m.tryAgain)}
					</Button>
				</Box>
			}
			details={
				<Stack direction="column" sx={{ gap: 6 }}>
					<Stack direction="column" sx={{ gap: 2 }}>
						<Typography id={progressId} color="error">
							{intl.formatMessage(m.progressStopped)}
						</Typography>

						<LinearProgress
							aria-labelledby={progressId}
							sx={{ height: 8 }}
							value={current}
							variant="determinate"
							color="error"
							{...(total === 0
								? { value: 0, max: 1 }
								: { current, total, max: total })}
						/>
					</Stack>

					<List
						disablePadding
						sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
					>
						<ListItem
							disableGutters
							disablePadding
							sx={{ alignItems: 'center', gap: 5 }}
						>
							<Icon name="openmoji-no-entry" size="40px" />

							<ListItemText slotProps={{ primary: { color: 'textSecondary' } }}>
								{intl.formatMessage(m.updateStoppedDetail)}
							</ListItemText>
						</ListItem>

						<ListItem
							disableGutters
							disablePadding
							sx={{ alignItems: 'center', gap: 5 }}
						>
							<Icon name="openmoji-safety" size="40px" />

							<ListItemText slotProps={{ primary: { color: 'textSecondary' } }}>
								{intl.formatMessage(m.dataSafetyDetail)}
							</ListItemText>
						</ListItem>
					</List>

					<AdvancedErrorDetails
						errorMessage={error.toString()}
						title={intl.formatMessage(m.advanced)}
					/>
				</Stack>
			}
			description={intl.formatMessage(m.migrationErrorDescription)}
			icon={<Icon name="material-error" color="error" size="128px" />}
			title={intl.formatMessage(m.migrationErrorTitle)}
			warning={intl.formatMessage(m.doNotCloseAppWarning)}
		/>
	)
}

function NeedsSpacePanel({ spaceNeeded }: { spaceNeeded: number }) {
	const intl = useIntl()

	const spaceNeededMb = bytesToMegabytes(spaceNeeded)

	const openSystemSettings = useMutation(openSystemSettingsMutationOptions())

	const retryMigration = useMutation(retryMigrationMutationOptions())

	return (
		<MigrationPanelLayout
			actions={
				<Stack direction="row" sx={{ gap: 4, justifyContent: 'center' }}>
					<Button
						fullWidth
						variant="contained"
						sx={{ maxWidth: 400 }}
						onClick={() => {
							openSystemSettings.mutate('storage')
						}}
					>
						{intl.formatMessage(m.openSettings)}
					</Button>

					<Button
						fullWidth
						variant="outlined"
						sx={{ maxWidth: 400 }}
						loading={retryMigration.status === 'pending'}
						onClick={() => {
							if (retryMigration.status === 'pending') {
								return
							}

							retryMigration.mutate()
						}}
					>
						{intl.formatMessage(m.continue)}
					</Button>
				</Stack>
			}
			details={
				<List
					disablePadding
					sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
				>
					<ListItem
						disableGutters
						disablePadding
						sx={{ alignItems: 'center', gap: 5 }}
					>
						<Icon name="openmoji-save" size="40px" />

						<ListItemText slotProps={{ primary: { color: 'textSecondary' } }}>
							{intl.formatMessage(m.notEnoughSpaceSpaceRequiredDetail, {
								value:
									spaceNeededMb >= 1000
										? intl.formatMessage(m.spaceRequiredGb, {
												value: spaceNeededMb / 1_000,
											})
										: intl.formatMessage(m.spaceRequiredMb, {
												value: spaceNeededMb,
											}),
							})}
						</ListItemText>
					</ListItem>

					<ListItem
						disableGutters
						disablePadding
						sx={{ alignItems: 'center', gap: 5 }}
					>
						<Icon name="openmoji-safety" size="40px" />

						<ListItemText slotProps={{ primary: { color: 'textSecondary' } }}>
							{intl.formatMessage(m.dataSafetyDetail)}
						</ListItemText>
					</ListItem>
				</List>
			}
			description={intl.formatMessage(m.notEnoughSpaceDescription)}
			icon={
				<Box
					sx={{
						backgroundColor: DARKER_ORANGE,
						borderRadius: '50%',
						display: 'flex',
						padding: 6,
					}}
				>
					<Icon
						name="material-symbols-deployed-code-update"
						htmlColor={WHITE}
						size="64px"
					/>
				</Box>
			}
			title={intl.formatMessage(m.notEnoughSpaceTitle)}
			warning={intl.formatMessage(m.freeUpSpaceWarning)}
		/>
	)
}

const rotate = keyframes`
	100% {
		transform: rotate(360deg);
	}
`

function InProgressPanel({
	current,
	total,
}: {
	current: number
	total: number
}) {
	const intl = useIntl()

	const progressId = useId()

	return (
		<MigrationPanelLayout
			details={
				total === 0 ? (
					<Box sx={{ display: 'grid', placeItems: 'center' }}>
						<CircularProgress variant="indeterminate" disableShrink size={40} />
					</Box>
				) : (
					<Stack direction="column" sx={{ gap: 6 }}>
						<Stack direction="column" sx={{ gap: 2 }}>
							<Icon
								name="material-symbols-autorenew"
								color="primary"
								sx={{ animation: `${rotate} 1.5s linear infinite` }}
							/>

							<LinearProgress
								aria-labelledby={progressId}
								max={total}
								sx={{ height: 8 }}
								value={current}
								variant="determinate"
							/>
						</Stack>

						<List
							disablePadding
							sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
						>
							<ListItem
								disableGutters
								disablePadding
								sx={{ alignItems: 'center', gap: 5 }}
							>
								<Icon name="openmoji-save" size="40px" />

								<ListItemText
									id={progressId}
									slotProps={{ primary: { color: 'textSecondary' } }}
								>
									{intl.formatMessage(m.inProgressProjectDetail, {
										current,
										total,
									})}
								</ListItemText>
							</ListItem>

							<ListItem
								disableGutters
								disablePadding
								sx={{ alignItems: 'center', gap: 5 }}
							>
								<Icon name="openmoji-safety" size="40px" />

								<ListItemText
									slotProps={{ primary: { color: 'textSecondary' } }}
								>
									{intl.formatMessage(m.dataSafetyDetail)}
								</ListItemText>
							</ListItem>
						</List>
					</Stack>
				)
			}
			description={intl.formatMessage(m.inProgressDescription)}
			icon={
				<Box
					sx={{
						backgroundColor: DARKER_ORANGE,
						borderRadius: '50%',
						display: 'flex',
						padding: 6,
					}}
				>
					<Icon
						name="material-symbols-deployed-code-update"
						htmlColor={WHITE}
						size={64}
					/>
				</Box>
			}
			title={intl.formatMessage(m.inProgressTitle)}
			warning={intl.formatMessage(m.doNotCloseAppWarning)}
		/>
	)
}

function SuccessPanel() {
	const intl = useIntl()
	const router = useRouter()

	return (
		<Stack direction="column" sx={{ flex: 1 }}>
			<Stack
				direction="column"
				sx={{
					flex: 1,
					gap: 10,
					justifyContent: 'center',
					overflow: 'auto',
					padding: 6,
				}}
			>
				<Stack direction="column" sx={{ alignItems: 'center', gap: 6 }}>
					<Icon
						name="material-check-circle-rounded"
						htmlColor={GREEN}
						size="128px"
					/>

					<Typography
						variant="h1"
						sx={{ fontWeight: 500, textAlign: 'center', textWrap: 'balance' }}
					>
						{intl.formatMessage(m.successTitle)}
					</Typography>

					<Typography
						component="p"
						variant="h2"
						sx={{ fontWeight: 400, textAlign: 'center', textWrap: 'balance' }}
					>
						{intl.formatMessage(m.successDescription)}
					</Typography>
				</Stack>
			</Stack>

			<Box
				sx={{ bottom: 0, left: 0, padding: 6, position: 'sticky', right: 0 }}
			>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'center',
					}}
				>
					<Button
						onClick={() => {
							router.navigate({
								href: buildDocumentReloadURL(router, '/'),
								reloadDocument: true,
							})
						}}
						fullWidth
						variant="contained"
						sx={{ maxWidth: 400 }}
					>
						{intl.formatMessage(m.startUsingComapeoButton)}
					</Button>
				</Box>
			</Box>
		</Stack>
	)
}

function MigrationPanelLayout({
	actions,
	description,
	details,
	icon,
	title,
	warning,
}: {
	actions?: ReactNode
	description: string
	details: ReactNode
	icon: ReactNode
	title: string
	warning: string
}) {
	return (
		<Stack direction="column" sx={{ flex: 1 }}>
			<Stack
				direction="column"
				sx={{ flex: 1, padding: 6, gap: 10, overflow: 'auto' }}
			>
				<Alert
					severity="warning"
					icon={<Icon name="material-warning-rounded" />}
					sx={{ border: `1px solid ${BLUE_GREY}`, borderRadius: 2 }}
				>
					<Typography color="textPrimary" sx={{ fontWeight: 500 }}>
						{warning}
					</Typography>
				</Alert>

				<Stack direction="column" sx={{ alignItems: 'center', gap: 6 }}>
					{icon}

					<Typography
						variant="h1"
						sx={{ fontWeight: 500, textAlign: 'center', textWrap: 'balance' }}
					>
						{title}
					</Typography>

					<Typography
						component="p"
						variant="h2"
						sx={{ fontWeight: 400, textAlign: 'center', textWrap: 'balance' }}
					>
						{description}
					</Typography>
				</Stack>

				{details}
			</Stack>

			{actions ? (
				<Box
					sx={{ bottom: 0, left: 0, padding: 6, position: 'sticky', right: 0 }}
				>
					{actions}
				</Box>
			) : null}
		</Stack>
	)
}

const m = defineMessages({
	doNotCloseAppWarning: {
		id: '$1.routes.migration.index.doNotCloseAppWarning',
		defaultMessage: 'Do not close app while updating!',
		description: 'Text for warning to not close app while migrating.',
	},
	freeUpSpaceWarning: {
		id: '$1.routes.migration.index.freeUpSpaceWarning',
		defaultMessage: 'Free up space to continue.',
		description: 'Text for warning to free up disk space to allow migration.',
	},
	inProgressTitle: {
		id: '$1.routes.migration.index.inProgressTitle',
		defaultMessage: 'Updating CoMapeo…',
		description: 'Title text for in-progress migration state.',
	},
	inProgressDescription: {
		id: '$1.routes.migration.index.inProgressDescription',
		defaultMessage: 'Projects are migrating to a newer, faster format',
		description: 'Description text for in-progress migration state.',
	},
	inProgressProjectDetail: {
		id: '$1.routes.migration.index.inProgressProjectDetail',
		defaultMessage: 'Updating {current, number} of {total, number}…',
		description: 'Line item displaying numeric migration progress.',
	},
	notEnoughSpaceTitle: {
		id: '$1.routes.migration.index.notEnoughSpaceTitle',
		defaultMessage: 'Update CoMapeo',
		description:
			'Title text for when there is not enough space to migrate automatically.',
	},
	notEnoughSpaceDescription: {
		id: '$1.routes.migration.index.notEnoughSpaceDescription',
		defaultMessage: 'New update available with performance improvements',
		description:
			'Description text for when there is not enough space to migrate automatically.',
	},
	spaceRequiredMb: {
		id: '$1.routes.migration.index.spaceRequiredMb',
		defaultMessage: '{value, number} MB',
		description:
			'Displayed amount of space needed for migration, in megabytes.',
	},
	spaceRequiredGb: {
		id: '$1.routes.migration.index.spaceRequiredGb',
		defaultMessage: '{value, number} GB',
		description:
			'Displayed amount of space needed for migration, in gigabytes.',
	},
	notEnoughSpaceSpaceRequiredDetail: {
		id: '$1.routes.migration.index.notEnoughSpaceSpaceRequiredDetail',
		defaultMessage: '~{value} required to update',
		description:
			'Line item displaying amount of disk space needed for migration.',
	},
	migrationErrorTitle: {
		id: '$1.routes.migration.index.migrationErrorTitle',
		defaultMessage: 'Something went wrong',
		description: 'Title text for when an error occurs during migration.',
	},
	migrationErrorDescription: {
		id: '$1.routes.migration.index.migrationErrorDescription',
		defaultMessage: 'Projects stopped migrating because of an error',
		description: 'Description text for when an error occurs during migration.',
	},
	progressStopped: {
		id: '$1.routes.migration.index.progressStopped',
		defaultMessage: 'Stopped',
		description: 'Label for progress indicator displayed when an error occurs.',
	},
	tryAgain: {
		id: '$1.routes.migration.index.tryAgain',
		defaultMessage: 'Try Again',
		description: 'Text for button to retry migration when it stops or fails.',
	},
	updateStoppedDetail: {
		id: '$1.routes.migration.index.updateStoppedDetail',
		defaultMessage: 'Update stopped…',
		description: 'Line item indicating that migration stopped.',
	},
	openSettings: {
		id: '$1.routes.migration.index.openSettings',
		defaultMessage: 'Open Settings',
		description: 'Text for button to open system settings.',
	},
	continue: {
		id: '$1.routes.migration.index.continue',
		defaultMessage: 'Continue',
		description:
			'Text for button to initiate migration after addressing storage limitations.',
	},
	dataSafetyDetail: {
		id: '$1.routes.migration.index.dataSafetyDetail',
		defaultMessage: 'All data is safe and protected',
		description: 'Line item describing data safety during migration.',
	},
	successTitle: {
		id: '$1.routes.migration.index.successTitle',
		defaultMessage: 'Update Complete!',
		description: 'Title text for when migration finishes.',
	},
	successDescription: {
		id: '$1.routes.migration.index.successDescription',
		defaultMessage: 'The latest version of CoMapeo is ready to use',
		description: 'Title text for when migration finishes.',
	},
	startUsingComapeoButton: {
		id: '$1.routes.migration.index.startUsingComapeoButton',
		defaultMessage: 'Start using CoMapeo',
		description:
			'Text for button to navigate to main app after migration finishes.',
	},
	advanced: {
		id: '1.routes.migration.index.advanced',
		defaultMessage: 'Advanced',
		description:
			'Title text for the collapsible section that shows the actual error message.',
	},
})
