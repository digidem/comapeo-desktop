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
import { useSpinDelay } from 'spin-delay'

import { BLUE_GREY, LIGHT_GREY } from '../../../colors.ts'
import { DecentDialog } from '../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../components/error-dialog.tsx'
import { Icon } from '../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../hooks/icon.ts'
import { bytesToMegabytes } from '../../../lib/bytes-to-megabytes.ts'

export const Route = createFileRoute('/app/settings/background-map')({
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
					paddingBlock: 4,
					paddingInline: 6,
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

			<Suspense
				fallback={
					<Box sx={{ display: 'grid', flex: 1, placeItems: 'center' }}>
						<CircularProgress disableShrink />
					</Box>
				}
			>
				<MainContent />
			</Suspense>
		</Stack>
	)
}

function MainContent() {
	const intl = useIntl()

	const importCustomMapFile = useImportCustomMapFile()
	const removeCustomMapFile = useRemoveCustomMapFile()

	const isChooseVisiblyPending = useSpinDelay(
		importCustomMapFile.status === 'pending',
		{ delay: 100 },
	)

	const isRemoveVisiblyPending = useSpinDelay(
		removeCustomMapFile.status === 'pending',
		{ delay: 100 },
	)

	// NOTE: Hook is not suspense-based.
	const customMapInfo = useGetCustomMapInfo()

	let content: React.ReactNode

	if (customMapInfo.status === 'pending') {
		content = (
			<Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
				<CircularProgress disableShrink />
			</Box>
		)
	} else if (customMapInfo.status === 'error') {
		content = (
			<NoCustomMap
				chooseIsPending={isChooseVisiblyPending}
				error={customMapInfo.error}
				onChooseMap={(file) => {
					importCustomMapFile.mutate({ file })
				}}
				onRemoveMap={() => removeCustomMapFile.mutate(undefined)}
				removeIsPending={isRemoveVisiblyPending}
			/>
		)
	} else {
		content = (
			<CustomMapDetails
				created={customMapInfo.data.created}
				name={customMapInfo.data.name}
				onRemoveMap={() => removeCustomMapFile.mutate(undefined)}
				removeIsPending={isRemoveVisiblyPending}
				size={customMapInfo.data.size}
			/>
		)
	}

	return (
		<>
			{content}

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

function NoCustomMap({
	chooseIsPending,
	error,
	onChooseMap,
	onRemoveMap,
	removeIsPending,
}: {
	chooseIsPending: boolean
	error: Error
	onChooseMap: (file: File) => void
	onRemoveMap: () => void
	removeIsPending: boolean
}) {
	const intl = useIntl()

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Container
					disableGutters
					maxWidth="sm"
					sx={{
						display: 'flex',
						flexDirection: 'column',
						flex: 1,
						padding: 6,
					}}
				>
					<Stack
						direction="column"
						sx={{ gap: 6, paddingBlock: 6, paddingInline: 4 }}
					>
						{getErrorCode(error) === 'MAP_NOT_FOUND' ? (
							<Box
								sx={{
									bgcolor: LIGHT_GREY,
									border: `1px solid ${BLUE_GREY}`,
									borderRadius: 2,
									padding: 4,
								}}
							>
								<Typography>{intl.formatMessage(m.description)}</Typography>
							</Box>
						) : (
							<>
								<Typography sx={{ textAlign: 'center' }}>
									{intl.formatMessage(m.customMapInfoError)}
								</Typography>

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
							</>
						)}
					</Stack>
				</Container>
			</Stack>

			<Stack
				direction="column"
				sx={{
					borderTop: `1px solid ${BLUE_GREY}`,
					gap: 4,
					padding: 6,
				}}
			>
				<Button
					component="label"
					fullWidth
					loading={chooseIsPending}
					loadingPosition="start"
					role={undefined}
					startIcon={<Icon name="material-file-download" />}
					sx={{ maxWidth: 400, alignSelf: 'center' }}
					tabIndex={-1}
					variant="outlined"
				>
					{intl.formatMessage(m.chooseFile)}

					<HiddenSelectFileInput
						onClick={(file) => {
							onChooseMap(file)
						}}
					/>
				</Button>

				<Typography color="textSecondary" sx={{ textAlign: 'center' }}>
					{intl.formatMessage(m.acceptedFileTypes)}
				</Typography>
			</Stack>
		</Stack>
	)
}

function CustomMapDetails({
	created,
	name,
	onRemoveMap,
	removeIsPending,
	size,
}: {
	created: number
	name: string
	onRemoveMap: () => void
	removeIsPending: boolean
	size: number
}) {
	const intl = useIntl()

	const headingIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 3,
	})

	const sizeIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 1,
	})

	const calculatedSize = bytesToMegabytes(size).toFixed(0)

	const displayedSize = parseInt(calculatedSize, 10) < 1 ? '<1' : calculatedSize

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Container
					disableGutters
					maxWidth="sm"
					sx={{
						display: 'flex',
						flex: 1,
						flexDirection: 'column',
						padding: 6,
					}}
				>
					<Stack
						direction="column"
						sx={{ flex: 1, gap: 10, justifyContent: 'space-between' }}
					>
						<Stack
							direction="column"
							sx={{
								border: `1px solid ${BLUE_GREY}`,
								borderRadius: 2,
								flex: 1,
								gap: 20,
								justifyContent: 'center',
								overflowWrap: 'break-word',
								paddingBlock: 20,
								paddingInline: 6,
							}}
						>
							<Stack direction="column" sx={{ gap: 10, alignItems: 'center' }}>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'center',
										borderRadius: '50%',
										padding: 4,
										backgroundColor: LIGHT_GREY,
									}}
								>
									<Icon
										name="material-layers-outlined"
										size={headingIconSize}
									/>
								</Box>

								<Typography
									component="p"
									variant="h1"
									sx={{
										fontWeight: 500,
										textAlign: 'center',
										textWrap: 'balance',
									}}
								>
									{name}
								</Typography>
							</Stack>

							<Stack direction="column" sx={{ gap: 4, alignItems: 'center' }}>
								<Stack direction="row" sx={{ gap: 2 }}>
									<Icon name="material-layers-outlined" size={sizeIconSize} />

									<Typography sx={{ fontWeight: 500 }}>
										{intl.formatMessage(m.sizeInMegabytes, {
											value: displayedSize,
										})}
									</Typography>
								</Stack>

								<Typography color="textSecondary" sx={{ textAlign: 'center' }}>
									{intl.formatMessage(m.addedOn, {
										value: (
											<time dateTime={new Date(created).toISOString()}>
												{intl.formatDate(created, {
													year: 'numeric',
													month: 'long',
													day: 'numeric',
												})}
											</time>
										),
									})}
								</Typography>
							</Stack>
						</Stack>
					</Stack>
				</Container>
			</Stack>

			<Stack
				direction="column"
				sx={{
					borderTop: `1px solid ${BLUE_GREY}`,
					gap: 4,
					padding: 6,
				}}
			>
				<Button
					color="error"
					fullWidth
					loading={removeIsPending}
					loadingPosition="start"
					onClick={() => {
						onRemoveMap()
					}}
					startIcon={<Icon name="material-symbols-delete" />}
					sx={{ alignSelf: 'center', maxWidth: 400 }}
					variant="contained"
				>
					{intl.formatMessage(m.removeMap)}
				</Button>
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
	readonly sizeInMegabytes: { readonly value: MessageValue }
	readonly addedOn: { readonly value: MessageValue }
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
	sizeInMegabytes: {
		id: '$1.routes.app.settings.background-map.sizeInMegabytes',
		defaultMessage: '{value} MB',
		description:
			'Text describing what kind of files are usable for background maps.',
	},
	addedOn: {
		id: '$1.routes.app.settings.background-map.addedOn',
		defaultMessage: 'Added on {value}',
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
