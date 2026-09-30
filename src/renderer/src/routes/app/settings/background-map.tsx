import { Suspense } from 'react'
import {
	getErrorCode,
	useGetCustomMapInfo,
	useImportCustomMapFile,
	useRemoveCustomMapFile,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'

import { BLUE_GREY, LIGHT_GREY } from '../../../colors.ts'
import { DecentDialog } from '../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../components/error-dialog.tsx'
import { Icon } from '../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../hooks/icon.ts'
import { bytesToMegabytes } from '../../../lib/bytes-to-megabytes.ts'

export const Route = createFileRoute('/app/settings/background-map')({
	staticData: {
		getNavTitle: () => {
			return m.navTitle
		},
	},
	component: RouteComponent,
})

function RouteComponent() {
	const intl = useIntl()

	const router = useRouter()

	const headerIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 1.5,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				component="header"
				direction="row"
				sx={{
					alignItems: 'center',
					borderBottom: `1px solid ${BLUE_GREY}`,
					gap: 2,
					padding: 4,
				}}
			>
				<IconButton
					aria-label={intl.formatMessage(m.goBackAccessibleLabel)}
					color="inherit"
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({ to: '/app', replace: true })
					}}
				>
					<Icon name="material-arrow-back" size={headerIconSize} />
				</IconButton>

				<Typography variant="h1" sx={{ fontWeight: 500, textAlign: 'center' }}>
					{intl.formatMessage(m.navTitle)}
				</Typography>
			</Stack>

			<Stack
				sx={{ flex: 1, overflow: 'auto', scrollbarGutter: 'stable both-edges' }}
			>
				<Container disableGutters maxWidth="sm">
					<Stack direction="column" sx={{ flex: 1 }}>
						<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
							<Stack direction="column" sx={{ padding: 6, gap: 6 }}>
								<Box
									sx={{
										bgcolor: LIGHT_GREY,
										border: `1px solid ${BLUE_GREY}`,
										borderRadius: 2,
										padding: 4,
									}}
								>
									<Typography sx={{ textAlign: 'center' }}>
										{intl.formatMessage(m.description)}
									</Typography>
								</Box>

								<Divider />

								<Suspense
									fallback={
										<Box sx={{ display: 'grid', placeItems: 'center' }}>
											<CircularProgress disableShrink />
										</Box>
									}
								>
									<CustomMap />
								</Suspense>
							</Stack>
						</Stack>
					</Stack>
				</Container>
			</Stack>
		</Stack>
	)
}

function CustomMap() {
	const intl = useIntl()

	const importCustomMapFile = useImportCustomMapFile()
	const removeCustomMapFile = useRemoveCustomMapFile()

	return (
		<>
			<CustomMapInfo
				onChooseMap={(file) => {
					importCustomMapFile.mutate({ file })
				}}
				removeIsPending={removeCustomMapFile.status === 'pending'}
				chooseIsPending={importCustomMapFile.status === 'pending'}
				onRemoveMap={() => {
					removeCustomMapFile.mutate(undefined)
				}}
			/>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					importCustomMapFile.status === 'error'
						? {
								errorMessage: importCustomMapFile.error.toString(),
								onClose: () => {
									importCustomMapFile.reset()
								},
							}
						: removeCustomMapFile.status === 'error'
							? {
									errorMessage: removeCustomMapFile.error.toString(),
									onClose: () => {
										removeCustomMapFile.reset()
									},
								}
							: null
				}
			>
				{({ errorMessage, onClose }) => (
					<ErrorDialogContent errorMessage={errorMessage} onClose={onClose} />
				)}
			</DecentDialog>

			<DecentDialog
				maxWidth="sm"
				value={importCustomMapFile.status === 'success' || null}
			>
				{() => (
					<Stack direction="column">
						<Stack direction="column" sx={{ gap: 10, flex: 1, padding: 20 }}>
							<Stack direction="column" sx={{ alignItems: 'center', gap: 4 }}>
								<Typography
									variant="h1"
									sx={{ fontWeight: 500, textAlign: 'center' }}
								>
									{intl.formatMessage(m.mapUpdateSuccessTitle)}
								</Typography>

								<Typography>
									{intl.formatMessage(m.mapUpdateSuccessDescription)}
								</Typography>
							</Stack>
						</Stack>

						<Box
							sx={{
								position: 'sticky',
								bottom: 0,
								display: 'flex',
								justifyContent: 'center',
								padding: 6,
							}}
						>
							<Button
								fullWidth
								variant="outlined"
								onClick={() => {
									importCustomMapFile.reset()
								}}
								sx={{ maxWidth: 400, alignSelf: 'center' }}
							>
								{intl.formatMessage(m.close)}
							</Button>
						</Box>
					</Stack>
				)}
			</DecentDialog>
		</>
	)
}

type MapFileProps = {
	chooseIsPending: boolean
	onChooseMap: (file: File) => void
	onRemoveMap: () => void
	removeIsPending: boolean
}

function CustomMapInfo({
	chooseIsPending,
	onChooseMap,
	onRemoveMap,
	removeIsPending,
}: MapFileProps) {
	const intl = useIntl()

	const customMapInfo = useGetCustomMapInfo()

	if (customMapInfo.status === 'pending') {
		return null
	}

	if (customMapInfo.status === 'error') {
		if (getErrorCode(customMapInfo.error) === 'MAP_NOT_FOUND') {
			return (
				<Stack direction="column" sx={{ gap: 5 }}>
					<Button
						component="label"
						variant="outlined"
						fullWidth
						sx={{ maxWidth: 400, alignSelf: 'center' }}
						startIcon={<Icon name="material-file-download" />}
						loading={chooseIsPending}
						loadingPosition="start"
						tabIndex={-1}
						role={undefined}
					>
						{intl.formatMessage(m.chooseFile)}

						<HiddenSelectFileInput onClick={onChooseMap} />
					</Button>

					<Typography color="textSecondary" sx={{ textAlign: 'center' }}>
						{intl.formatMessage(m.acceptedFileTypes)}
					</Typography>
				</Stack>
			)
		}

		return (
			<Stack direction="column" sx={{ gap: 4 }}>
				<Typography sx={{ textAlign: 'center' }}>
					{intl.formatMessage(m.customMapInfoError)}
				</Typography>
				<Button
					component="label"
					variant="outlined"
					fullWidth
					loading={chooseIsPending}
					loadingPosition="start"
					sx={{ maxWidth: 400, alignSelf: 'center' }}
					startIcon={<Icon name="material-file-download" />}
					tabIndex={-1}
					role={undefined}
				>
					{intl.formatMessage(m.chooseFile)}

					<HiddenSelectFileInput onClick={onChooseMap} />
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
					{intl.formatMessage(m.removeMap)}
				</Button>
			</Stack>
		)
	}

	const calculatedSize = bytesToMegabytes(customMapInfo.data.size).toFixed(0)
	const displayedSize = parseInt(calculatedSize, 10) < 1 ? '<1' : calculatedSize

	return (
		<Stack direction="column" sx={{ gap: 4 }}>
			<Stack direction="row" sx={{ justifyContent: 'space-between' }}>
				<Typography color="textSecondary">
					{intl.formatMessage(m.mapNameColumnLabel)}
				</Typography>

				<Typography color="textSecondary">
					{intl.formatMessage(m.dateAddedColumnColumnLabel)}
				</Typography>
			</Stack>

			<Stack
				direction="column"
				sx={{
					border: `1px solid ${BLUE_GREY}`,
					borderRadius: 2,
					padding: 5,
					gap: 5,
				}}
			>
				<Stack direction="row" sx={{ gap: 2 }}>
					<Stack direction="column" sx={{ flex: 1, overflow: 'hidden' }}>
						<Typography
							sx={{
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								overflow: 'hidden',
								fontWeight: 500,
							}}
						>
							{customMapInfo.data.name}
						</Typography>

						<Typography variant="body2" color="textSecondary">
							{intl.formatMessage(m.sizeInMegabytes, { value: displayedSize })}
						</Typography>
					</Stack>

					<Typography variant="body2" color="textSecondary">
						<time dateTime={new Date(customMapInfo.data.created).toISOString()}>
							{intl.formatDate(customMapInfo.data.created, {
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
						{intl.formatMessage(m.removeMap)}
					</Button>
				</Box>
			</Stack>
		</Stack>
	)
}

const VISUALLY_HIDDEN = {
	clip: 'rect(0 0 0 0)',
	clipPath: 'inset(50%)',
	height: 1,
	overflow: 'hidden',
	position: 'absolute',
	bottom: 0,
	left: 0,
	whiteSpace: 'nowrap',
	width: 1,
} as const

function HiddenSelectFileInput({ onClick }: { onClick: (file: File) => void }) {
	return (
		<input
			type="file"
			onChange={(event) => {
				const file = event.target.files?.item(0)

				if (!file) {
					return
				}

				onClick(file)
			}}
			accept=".smp"
			style={VISUALLY_HIDDEN}
		/>
	)
}

const m = defineMessages<{
	readonly goBackAccessibleLabel: NoMessageValues
	readonly navTitle: NoMessageValues
	readonly description: NoMessageValues
	readonly chooseFile: NoMessageValues
	readonly acceptedFileTypes: NoMessageValues
	readonly mapNameColumnLabel: NoMessageValues
	readonly dateAddedColumnColumnLabel: NoMessageValues
	readonly sizeInMegabytes: { readonly value: MessageValue }
	readonly removeMap: NoMessageValues
	readonly customMapInfoError: NoMessageValues
	readonly mapUpdateSuccessTitle: NoMessageValues
	readonly mapUpdateSuccessDescription: NoMessageValues
	readonly close: NoMessageValues
}>({
	goBackAccessibleLabel: {
		id: 'routes.app.settings.background-map.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button.',
	},

	navTitle: {
		id: '$1.routes.app.settings.background-map.navTitle',
		defaultMessage: 'Background Map',
		description: 'Title of the background map settings page.',
	},
	description: {
		id: '$1.routes.app.settings.background-map.description',
		defaultMessage:
			'Custom background maps are viewable offline and only on this device.',
		description: 'Description of how custom background maps work.',
	},
	chooseFile: {
		id: '$1.routes.app.settings.background-map.chooseFile',
		defaultMessage: 'Choose File',
		description: 'Text for button to choose file.',
	},
	acceptedFileTypes: {
		id: '$1.routes.app.settings.background-map.acceptedFileTypes',
		defaultMessage: 'Accepted file types are .smp',
		description:
			'Text describing what kind of files are usable for background maps.',
	},
	mapNameColumnLabel: {
		id: '$1.routes.app.settings.background-map.mapNameColumnLabel',
		defaultMessage: 'Map Name',
		description: 'Column label text for map name.',
	},
	dateAddedColumnColumnLabel: {
		id: '$1.routes.app.settings.background-map.dateAdded',
		defaultMessage: 'Date Added',
		description: 'Column label text for date added.',
	},
	sizeInMegabytes: {
		id: '$1.routes.app.settings.background-map.sizeInMegabytes',
		defaultMessage: '{value} MB',
		description:
			'Text describing what kind of files are usable for background maps.',
	},
	removeMap: {
		id: '$1.routes.app.settings.background-map.removeMap',
		defaultMessage: 'Remove Map',
		description: 'Text for button to remove map',
	},
	customMapInfoError: {
		id: '$1.routes.app.settings.background-map.customMapInfoError',
		defaultMessage:
			'Could not get custom map information from file. Please remove it or choose a different file.',
		description:
			'Text displayed when info about a custom map cannot be retrieved.',
	},
	mapUpdateSuccessTitle: {
		id: '$1.routes.app.settings.background-map.mapUpdateSuccessTitle',
		defaultMessage: 'Updated!',
		description: 'Title text for dialog when updating map successfully.',
	},
	mapUpdateSuccessDescription: {
		id: '$1.routes.app.settings.background-map.mapUpdateSuccessDescription',
		defaultMessage: 'CoMapeo is now using the latest background map.',
		description: 'Description text for dialog when updating map successfully.',
	},
	close: {
		id: '$1.routes.app.settings.background-map.close',
		defaultMessage: 'Close',
		description: 'Text displayed for closing dialogs',
	},
})
