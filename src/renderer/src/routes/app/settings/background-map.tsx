import { Suspense } from 'react'
import { useMapStyleUrl } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, LIGHT_GREY } from '#renderer/src/colors.ts'
import { ErrorBoundary } from '#renderer/src/components/error-boundary.tsx'
import {
	ErrorDialog,
	type Props as ErrorDialogProps,
} from '#renderer/src/components/error-dialog.tsx'
import { Icon } from '#renderer/src/components/icon.tsx'
import { useRefreshTokensActions } from '#renderer/src/contexts/refresh-tokens-store-context.ts'
import { bytesToMegabytes } from '#renderer/src/lib/bytes-to-megabytes.ts'
import { selectFileMutationOptions } from '#renderer/src/lib/queries/file-system.ts'
import { createGlobalMutationsKey } from '#renderer/src/lib/queries/global-mutations.ts'
import {
	getCustomMapInfoQueryOptions,
	importSMPFileMutationOptions,
	removeSMPFileMutationOptions,
} from '#renderer/src/lib/queries/maps.ts'

export const Route = createFileRoute('/app/settings/background-map')({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const router = useRouter()

	return (
		<>
			<Stack direction="column" flex={1}>
				<Stack
					direction="row"
					alignItems="center"
					component="nav"
					gap={4}
					padding={4}
					borderBottom={`1px solid ${BLUE_GREY}`}
				>
					<IconButton
						aria-label={t(m.goBackAccessibleLabel)}
						onClick={() => {
							if (router.history.canGoBack()) {
								router.history.back()
								return
							}

							router.navigate({ to: '/app/settings', replace: true })
						}}
					>
						<Icon name="material-arrow-back" size={30} />
					</IconButton>
					<Typography variant="h1" fontWeight={500}>
						{t(m.navTitle)}
					</Typography>
				</Stack>

				<Stack direction="column" flex={1} overflow="auto">
					<Stack direction="column" padding={6} gap={6}>
						<Box
							bgcolor={LIGHT_GREY}
							border={`1px solid ${BLUE_GREY}`}
							borderRadius={2}
							padding={4}
						>
							<Typography textAlign="center">{t(m.description)}</Typography>
						</Box>

						<Divider />

						<Suspense
							fallback={
								<Box display="grid" sx={{ placeItems: 'center' }}>
									<CircularProgress disableShrink />
								</Box>
							}
						>
							<CustomMap />
						</Suspense>
					</Stack>
				</Stack>
			</Stack>
		</>
	)
}

const SELECT_FILE_MUTATION_KEY = createGlobalMutationsKey(['files', 'select'])

const IMPORT_SMP_FILE_MUTATION_KEY = createGlobalMutationsKey([
	'maps',
	'import',
])

const REMOVE_CUSTOM_MAP_MUTATION_KEY = createGlobalMutationsKey([
	'maps',
	'remove',
])

function CustomMap() {
	const { formatMessage: t } = useIntl()

	const { data: styleUrl } = useMapStyleUrl()

	const { update: updateRefreshToken } = useRefreshTokensActions()

	const selectFile = useMutation({
		...selectFileMutationOptions(),
		mutationKey: SELECT_FILE_MUTATION_KEY,
	})

	const importSMPFile = useMutation({
		...importSMPFileMutationOptions(),
		mutationKey: IMPORT_SMP_FILE_MUTATION_KEY,
	})

	const removeCustomMap = useMutation({
		...removeSMPFileMutationOptions(),
		mutationKey: REMOVE_CUSTOM_MAP_MUTATION_KEY,
	})

	const errorDialogProps: ErrorDialogProps =
		selectFile.status === 'error'
			? {
					open: true,
					errorMessage: selectFile.error.toString(),
					onClose: () => {
						selectFile.reset()
					},
				}
			: importSMPFile.status === 'error'
				? {
						open: true,
						errorMessage: importSMPFile.error.toString(),
						onClose: () => {
							importSMPFile.reset()
						},
					}
				: removeCustomMap.status === 'error'
					? {
							open: true,
							errorMessage: removeCustomMap.error.toString(),
							onClose: () => {
								importSMPFile.reset()
							},
						}
					: {
							open: false,
							onClose: () => {},
						}

	return (
		<>
			<ErrorBoundary
				getResetKey={() => styleUrl}
				fallback={({ reset }) => (
					<CustomMapInfoError
						chooseIsPending={
							selectFile.status === 'pending' ||
							importSMPFile.status === 'pending'
						}
						onChooseMap={() => {
							selectFile.mutate(
								{ extensionFilters: ['smp'] },
								{
									onSuccess: (fileInfo) => {
										if (!fileInfo) {
											return
										}

										importSMPFile.mutate(
											{ filePath: fileInfo.path },
											{
												onSuccess: () => {
													updateRefreshToken('maps')
													reset()
												},
											},
										)
									},
								},
							)
						}}
						removeIsPending={removeCustomMap.status === 'pending'}
						onRemoveMap={() => {
							removeCustomMap.mutate(undefined, {
								onSuccess: () => {
									updateRefreshToken('maps')
									reset()
								},
							})
						}}
					/>
				)}
			>
				<CustomMapInfo
					onChooseMap={() => {
						selectFile.mutate(
							{ extensionFilters: ['smp'] },
							{
								onSuccess: (fileInfo) => {
									if (!fileInfo) {
										return
									}

									importSMPFile.mutate(
										{ filePath: fileInfo.path },
										{
											onSuccess: () => {
												updateRefreshToken('maps')
											},
										},
									)
								},
							},
						)
					}}
					removeIsPending={removeCustomMap.status === 'pending'}
					chooseIsPending={
						selectFile.status === 'pending' ||
						importSMPFile.status === 'pending'
					}
					onRemoveMap={() => {
						removeCustomMap.mutate(undefined, {
							onSuccess: () => {
								updateRefreshToken('maps')
							},
						})
					}}
					styleUrl={styleUrl}
				/>
			</ErrorBoundary>

			<ErrorDialog {...errorDialogProps} />

			<SuccessDialog
				open={importSMPFile.status === 'success'}
				title={t(m.mapUpdateSuccessTitle)}
				description={t(m.mapUpdateSuccessDescription)}
				onClose={() => {
					importSMPFile.reset()
				}}
			/>
		</>
	)
}

// TODO: Potentially extract as shared component
function SuccessDialog({
	open,
	onClose,
	title,
	description,
}: {
	open: boolean
	title: string
	description?: string
	onClose: () => void
}) {
	const { formatMessage: t } = useIntl()

	return (
		<Dialog open={open} maxWidth="sm">
			<Stack direction="column">
				<Stack direction="column" gap={10} flex={1} padding={20}>
					<Stack direction="column" alignItems="center" gap={4}>
						<Typography variant="h1" fontWeight={500} textAlign="center">
							{title}
						</Typography>

						{description ? <Typography>{description}</Typography> : null}
					</Stack>
				</Stack>

				<Box
					position="sticky"
					bottom={0}
					display="flex"
					justifyContent="center"
					padding={6}
				>
					<Button
						fullWidth
						variant="outlined"
						onClick={() => {
							onClose()
						}}
						sx={{ maxWidth: 400, alignSelf: 'center' }}
					>
						{t(m.close)}
					</Button>
				</Box>
			</Stack>
		</Dialog>
	)
}

type MapFileProps = {
	chooseIsPending: boolean
	onChooseMap: () => void
	onRemoveMap: () => void
	removeIsPending: boolean
}

function CustomMapInfo({
	chooseIsPending,
	onChooseMap,
	onRemoveMap,
	removeIsPending,
	styleUrl,
}: MapFileProps & { styleUrl: string }) {
	const { formatMessage: t, formatDate } = useIntl()

	const customMapInfo = useSuspenseQuery(
		getCustomMapInfoQueryOptions({ styleUrl }),
	)

	if (customMapInfo.status === 'error') {
		return (
			<CustomMapInfoError
				onChooseMap={onChooseMap}
				onRemoveMap={onRemoveMap}
				chooseIsPending={chooseIsPending}
				removeIsPending={removeIsPending}
			/>
		)
	}

	if (customMapInfo.data === null) {
		return (
			<Stack direction="column" gap={5}>
				<Button
					variant="outlined"
					fullWidth
					sx={{ maxWidth: 400, alignSelf: 'center' }}
					startIcon={<Icon name="material-file-download" />}
					loading={chooseIsPending}
					loadingPosition="start"
					onClick={() => {
						onChooseMap()
					}}
				>
					{t(m.chooseFile)}
				</Button>

				<Typography color="textSecondary" textAlign="center">
					{t(m.acceptedFileTypes)}
				</Typography>
			</Stack>
		)
	}

	const calculatedSize = bytesToMegabytes(customMapInfo.data.size).toFixed(0)
	const displayedSize = parseInt(calculatedSize, 10) < 1 ? '<1' : calculatedSize

	return (
		<Stack direction="column" gap={4}>
			<Stack direction="row" justifyContent="space-between">
				<Typography color="textSecondary">{t(m.mapNameColumnLabel)}</Typography>

				<Typography color="textSecondary">
					{t(m.dateAddedColumnColumnLabel)}
				</Typography>
			</Stack>

			<Stack
				direction="column"
				border={`1px solid ${BLUE_GREY}`}
				borderRadius={2}
				padding={5}
				gap={5}
			>
				<Stack direction="row" gap={2}>
					<Stack direction="column" flex={1} overflow="hidden">
						<Typography
							textOverflow="ellipsis"
							whiteSpace="nowrap"
							overflow="hidden"
							fontWeight={500}
						>
							{customMapInfo.data.name}
						</Typography>

						<Typography variant="body2" color="textSecondary">
							{t(m.sizeInMegabytes, { value: displayedSize })}
						</Typography>
					</Stack>

					<Typography variant="body2" color="textSecondary">
						<time dateTime={customMapInfo.data.created.toISOString()}>
							{formatDate(customMapInfo.data.created, {
								year: 'numeric',
								month: 'long',
								day: 'numeric',
							})}
						</time>
					</Typography>
				</Stack>

				<Box>
					<Button
						size="small"
						variant="text"
						color="error"
						onClick={() => {
							onRemoveMap()
						}}
					>
						{t(m.removeMap)}
					</Button>
				</Box>
			</Stack>
		</Stack>
	)
}

function CustomMapInfoError({
	chooseIsPending,
	onChooseMap,
	onRemoveMap,
	removeIsPending,
}: MapFileProps) {
	const { formatMessage: t } = useIntl()

	return (
		<Stack direction="column" gap={4}>
			<Typography textAlign="center">{t(m.customMapInfoError)}</Typography>

			<Button
				variant="outlined"
				fullWidth
				loading={chooseIsPending}
				loadingPosition="start"
				sx={{ maxWidth: 400, alignSelf: 'center' }}
				startIcon={<Icon name="material-file-download" />}
				onClick={() => {
					onChooseMap()
				}}
			>
				{t(m.chooseFile)}
			</Button>

			<Button
				variant="outlined"
				color="error"
				fullWidth
				loading={removeIsPending}
				loadingPosition="start"
				sx={{ maxWidth: 400, alignSelf: 'center' }}
				onClick={() => {
					onRemoveMap()
				}}
			>
				{t(m.removeMap)}
			</Button>
		</Stack>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.settings.background-map.navTitle',
		defaultMessage: 'Background Map',
		description: 'Title of the background map settings page.',
	},
	description: {
		id: 'routes.app.settings.background-map.description',
		defaultMessage:
			'Custom background maps are viewable offline and only on this device.',
		description: 'Description of how custom background maps work.',
	},
	chooseFile: {
		id: 'routes.app.settings.background-map.chooseFile',
		defaultMessage: 'Choose File',
		description: 'Text for button to choose file.',
	},
	acceptedFileTypes: {
		id: 'routes.app.settings.background-map.acceptedFileTypes',
		defaultMessage: 'Accepted file types are .smp',
		description:
			'Text describing what kind of files are usable for background maps.',
	},
	mapNameColumnLabel: {
		id: 'routes.app.settings.background-map.mapNameColumnLabel',
		defaultMessage: 'Map Name',
		description: 'Column label text for map name.',
	},
	dateAddedColumnColumnLabel: {
		id: 'routes.app.settings.background-map.dateAdded',
		defaultMessage: 'Date Added',
		description: 'Column label text for date added.',
	},
	sizeInMegabytes: {
		id: 'routes.app.settings.background-map.sizeInMegabytes',
		defaultMessage: '{value} MB',
		description:
			'Text describing what kind of files are usable for background maps.',
	},
	removeMap: {
		id: 'routes.app.settings.background-map.removeMap',
		defaultMessage: 'Remove Map',
		description: 'Text for button to remove map',
	},
	customMapInfoError: {
		id: 'routes.app.settings.background-map.customMapInfoError',
		defaultMessage:
			'Could not get custom map information from file. Please remove it or choose a different file.',
		description:
			'Text displayed when info about a custom map cannot be retrieved.',
	},
	mapUpdateSuccessTitle: {
		id: 'routes.app.settings.background-map.mapUpdateSuccessTitle',
		defaultMessage: 'Updated!',
		description: 'Title text for dialog when updating map successfully.',
	},
	mapUpdateSuccessDescription: {
		id: 'routes.app.settings.background-map.mapUpdateSuccessDescription',
		defaultMessage: 'CoMapeo is now using the latest background map.',
		description: 'Description text for dialog when updating map successfully.',
	},
	close: {
		id: 'routes.app.settings.background-map.close',
		defaultMessage: 'Close',
		description: 'Text displayed for closing dialogs',
	},
	goBackAccessibleLabel: {
		id: 'routes.app.settings.background-map.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button.',
	},
})
