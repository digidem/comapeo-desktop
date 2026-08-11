import { useDeferredValue, useEffect, useState, type ReactNode } from 'react'
import {
	Alert,
	Box,
	Button,
	Container,
	LinearProgress,
	List,
	Stack,
	Typography,
} from '@mui/material'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARKER_ORANGE, GREEN, WHITE } from '../../colors.ts'
import { AdvancedErrorDetails } from '../../components/advanced-error-details.tsx'
import { Icon } from '../../components/icon.tsx'
import { buildDocumentReloadURL } from '../../lib/navigation.ts'

export const Route = createFileRoute('/migration/')({
	component: RouteComponent,
})

type MigrationState =
	| { type: 'in_progress'; progress: number }
	| { type: 'error'; error: Error }
	| { type: 'success' }
	| { type: 'space_required'; spaceRequired: number }

function RouteComponent() {
	const [migrationState, setMigrationState] = useState<MigrationState>(() => {
		return { type: 'in_progress', progress: 0 }
	})

	useEffect(() => {
		const unsubscribe = window.runtime.onMigrationProgress((progress) => {
			if (progress === 100) {
				setMigrationState({ type: 'success' })
			} else {
				setMigrationState({ type: 'in_progress', progress })
			}
		})

		return () => {
			unsubscribe()
		}
	}, [setMigrationState])

	const deferredMigrationState = useDeferredValue(migrationState)

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				bgcolor: WHITE,
				height: '100%',
				overflow: 'auto',
			}}
		>
			<Container maxWidth="sm" sx={{ display: 'flex', flex: 1 }}>
				<MigrationPanel migrationState={deferredMigrationState} />
			</Container>
		</Box>
	)
}

function MigrationPanel({
	migrationState,
}: {
	migrationState: MigrationState
}) {
	const { formatMessage: t } = useIntl()

	const router = useRouter()

	if (migrationState.type === 'in_progress') {
		return (
			<MigrationPanelLayout
				details={
					<Stack direction="column">
						<Stack direction="column">
							<LinearProgress
								variant="determinate"
								value={migrationState.progress}
							/>
						</Stack>

						<List>
							<ListItem sx={{ alignItems: 'center', gap: 5 }}>
								<Icon name="openmoji-save" size="40px" />

								<ListItemText
									slotProps={{ primary: { color: 'textSecondary' } }}
								>
									{t(m.inProgressProjectDetail, { current: 0, total: 1 })}
								</ListItemText>
							</ListItem>

							<ListItem sx={{ alignItems: 'center', gap: 5 }}>
								<Icon name="openmoji-safety" size="40px" />

								<ListItemText
									slotProps={{ primary: { color: 'textSecondary' } }}
								>
									{t(m.dataSafetyDetail)}
								</ListItemText>
							</ListItem>
						</List>
					</Stack>
				}
				description={t(m.inProgressDescription)}
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
				title={t(m.inProgressTitle)}
				warning={t(m.doNotCloseAppWarning)}
			/>
		)
	}

	if (migrationState.type === 'space_required') {
		return (
			<MigrationPanelLayout
				actions={
					<Stack direction="row" sx={{ gap: 4 }}>
						<Button fullWidth variant="contained" sx={{ maxWidth: 400 }}>
							{t(m.openSettingsButton)}
						</Button>

						<Button fullWidth variant="outlined" sx={{ maxWidth: 400 }}>
							{t(m.skipForNowButton)}
						</Button>
					</Stack>
				}
				details={
					<Stack direction="column">
						<List>
							<ListItem sx={{ alignItems: 'center', gap: 5 }}>
								<Icon name="openmoji-save" size="40px" />

								<ListItemText
									slotProps={{ primary: { color: 'textSecondary' } }}
								>
									{t(m.notEnoughSpaceSpaceRequiredDetail, {
										value: t(m.spaceRequiredMb, { value: 100 }),
									})}
								</ListItemText>
							</ListItem>

							<ListItem sx={{ alignItems: 'center', gap: 5 }}>
								<Icon name="openmoji-safety" size="40px" />

								<ListItemText
									slotProps={{ primary: { color: 'textSecondary' } }}
								>
									{t(m.dataSafetyDetail)}
								</ListItemText>
							</ListItem>
						</List>
					</Stack>
				}
				description={t(m.notEnoughSpaceDescription)}
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
				title={t(m.notEnoughSpaceTitle)}
				warning={t(m.freeUpSpaceWarning)}
			/>
		)
	}

	if (migrationState.type === 'error') {
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
						<Button fullWidth variant="contained" sx={{ maxWidth: 400 }}>
							{t(m.openSettingsButton)}
						</Button>
					</Box>
				}
				details={
					<Stack>
						<Stack direction="column">
							<List>
								<ListItem sx={{ alignItems: 'center', gap: 5 }}>
									<Icon name="openmoji-no-entry" size="40px" />

									<ListItemText
										slotProps={{ primary: { color: 'textSecondary' } }}
									>
										{t(m.updateStoppedDetail)}
									</ListItemText>
								</ListItem>

								<ListItem sx={{ alignItems: 'center', gap: 5 }}>
									<Icon name="openmoji-safety" size="40px" />

									<ListItemText
										slotProps={{ primary: { color: 'textSecondary' } }}
									>
										{t(m.dataSafetyDetail)}
									</ListItemText>
								</ListItem>
							</List>
						</Stack>

						<AdvancedErrorDetails
							errorMessage={'Some error'}
							title="Advanced"
						/>
					</Stack>
				}
				description={t(m.outOfStorageErrorDescription)}
				icon={<Icon name="material-error" color="error" size="128px" />}
				title={t(m.outOfStorageErrorTitle)}
				warning={t(m.doNotCloseAppWarning)}
			/>
		)
	}

	return (
		<Stack direction="column">
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
						{t(m.successTitle)}
					</Typography>

					<Typography
						component="p"
						variant="h2"
						sx={{ fontWeight: 400, textAlign: 'center', textWrap: 'balance' }}
					>
						{t(m.successDescription)}
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
						{t(m.startUsingComapeoButton)}
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
		<Stack direction="column">
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
		description:
			'Line item displaying which project is being migrated for in-progress migration state.',
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
	outOfStorageErrorTitle: {
		id: '$1.routes.migration.index.outOfStorageErrorTitle',
		defaultMessage: 'Out of storage space',
		description: 'Title text for when storage runs out while migrating.',
	},
	outOfStorageErrorDescription: {
		id: '$1.routes.migration.index.outOfStorageErrorDescription',
		defaultMessage:
			'Projects stopped migrating because device ran out of space',
		description: 'Title text for when storage runs out while migrating.',
	},
	genericMigrationErrorTitle: {
		id: '$1.routes.migration.index.genericMigrationErrorTitle',
		defaultMessage: 'Something went wrong',
		description: 'Title text for when an error occurs while migrating.',
	},
	updateStoppedDetail: {
		id: '$1.routes.migration.index.updateStoppedDetail',
		defaultMessage: 'Update stopped…',
		description: 'Line item indicating that migration stopped.',
	},
	openSettingsButton: {
		id: '$1.routes.migration.index.openSettingsButton',
		defaultMessage: 'Open Settings',
		description: 'Text for button to open system settings.',
	},
	skipForNowButton: {
		id: '$1.routes.migration.index.skipForNowButton',
		defaultMessage: 'Skip for Now',
		description: 'Text for button to skip migration.',
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
})
