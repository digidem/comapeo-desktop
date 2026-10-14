import { useId, useState } from 'react'
import { useExportGeoJSON, useExportZipFile } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException } from '@sentry/react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageTag,
	type NoMessageValues,
} from 'react-intl'
import * as v from 'valibot'

import { BLUE_05 } from '../../../../../../../shared/colors.ts'
import { DecentDialog } from '../../../../../components/decent-dialog.tsx'
import { ErrorDialogContent } from '../../../../../components/error-dialog.tsx'
import { Icon } from '../../../../../components/icon.tsx'
import { Bold, Break } from '../../../../../components/intl-rich-text.tsx'
import { useAppForm } from '../../../../../hooks/forms.ts'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon.ts'
import { getLocaleStateQueryOptions } from '../../../../../lib/queries/app-settings.ts'
import { selectDirectoryMutationOptions } from '../../../../../lib/queries/file-system.ts'
import { createGlobalMutationsKey } from '../../../../../lib/queries/global-mutations.ts'
import { showItemInFolderMutationOptions } from '../../../../../lib/queries/system.ts'

export const Route = createFileRoute(
	'/app/projects/$projectId/_with-map-panel/download',
)({
	component: RouteComponent,
})

const DOWNLOAD_DATA_MUTATION_KEY = createGlobalMutationsKey(['download-data'])

const DataToDownloadSchema = v.union([
	v.literal('observations'),
	v.literal('observations-with-media'),
	v.literal('tracks'),
])

type DataToDownload = v.InferOutput<typeof DataToDownloadSchema>

function RouteComponent() {
	const { projectId } = Route.useParams()

	const router = useRouter()

	const navigateBack = () => {
		if (router.history.canGoBack()) {
			router.history.back()
			return
		}

		router.navigate({
			to: '/app/projects/$projectId',
			params: { projectId },
			replace: true,
		})
	}

	const [successState, setSuccessState] = useState<{
		dataDownloaded: DataToDownload
		savedToPath: string
	} | null>(null)

	return successState ? (
		<SuccessPanel
			dataDownloaded={successState.dataDownloaded}
			onDone={navigateBack}
			savedToPath={successState.savedToPath}
		/>
	) : (
		<DownloadForm
			onBack={navigateBack}
			onSuccess={({ dataDownloaded, savedToPath }) => {
				setSuccessState({ dataDownloaded, savedToPath })
			}}
			projectId={projectId}
		/>
	)
}

function SuccessPanel({
	dataDownloaded,
	onDone,
	savedToPath,
}: {
	dataDownloaded: DataToDownload
	onDone: () => void
	savedToPath: string
}) {
	const intl = useIntl()

	const showItemInFolder = useMutation(showItemInFolderMutationOptions())

	const iconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto', gap: 10 }}>
			<Stack
				direction="column"
				sx={{
					alignItems: 'center',
					flex: 1,
					gap: 10,
					paddingBlock: 20,
					paddingInline: 6,
				}}
			>
				<Stack direction="column" sx={{ alignItems: 'center', gap: 6 }}>
					<Icon
						color="success"
						name="material-check-circle-rounded"
						size={iconSize}
					/>

					<Typography
						component="h1"
						variant="heroHeader"
						sx={{ textAlign: 'center' }}
					>
						{intl.formatMessage(m.successPanelTitle)}
					</Typography>

					<Typography variant="heroSubheading" sx={{ textAlign: 'center' }}>
						{intl.formatMessage(
							dataDownloaded === 'observations'
								? m.successPanelDescriptionObservations
								: dataDownloaded === 'observations-with-media'
									? m.successPanelDescriptionObservationsWithMedia
									: m.successPanelDescriptionTracks,
							{ b: Bold, br: Break },
						)}
					</Typography>
				</Stack>

				<Button
					variant="text"
					onClick={() => {
						showItemInFolder.mutate(savedToPath)
					}}
				>
					{intl.formatMessage(m.successPanelViewInFileManager)}
				</Button>
			</Stack>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'center',
					padding: 6,
				}}
			>
				<Button
					fullWidth
					onClick={() => {
						onDone()
					}}
				>
					{intl.formatMessage(m.successPanelDone)}
				</Button>
			</Box>
		</Stack>
	)
}

const onChangeSchema = v.object({ dataToDownload: DataToDownloadSchema })

function DownloadForm({
	onBack,
	onSuccess,
	projectId,
}: {
	onBack: () => void
	onSuccess: (opts: {
		dataDownloaded: DataToDownload
		savedToPath: string
	}) => void
	projectId: string
}) {
	const intl = useIntl()

	const { data: localeState } = useSuspenseQuery(getLocaleStateQueryOptions())

	const exportGeoJSON = useExportGeoJSON({ projectId })
	const exportZipFile = useExportZipFile({ projectId })
	const selectDirectory = useMutation(selectDirectoryMutationOptions())

	const downloadData = useMutation({
		mutationKey: DOWNLOAD_DATA_MUTATION_KEY,
		mutationFn: async ({
			dataToDownload,
		}: {
			dataToDownload: DataToDownload
		}) => {
			const selectDirectoryResult = await selectDirectory.mutateAsync({
				actionLabel: intl.formatMessage(m.selectDirectoryDialogActionLabel),
			})

			if (!selectDirectoryResult) {
				return undefined
			}

			if (dataToDownload === 'observations-with-media') {
				return exportZipFile.mutateAsync({
					path: selectDirectoryResult.path,
					exportOptions: {
						attachments: true,
						lang: localeState.value,
						observations: true,
						tracks: false,
					},
				})
			}

			return exportGeoJSON.mutateAsync({
				path: selectDirectoryResult.path,
				exportOptions: {
					lang: localeState.value,
					observations: dataToDownload === 'observations',
					tracks: dataToDownload === 'tracks',
				},
			})
		},
	})

	const form = useAppForm({
		defaultValues: { dataToDownload: 'observations' },
		validators: { onChange: onChangeSchema },
		onSubmit: async ({ value }) => {
			const parsedValue = v.parse(onChangeSchema, value)

			let savedToPath
			try {
				savedToPath = await downloadData.mutateAsync({
					dataToDownload: parsedValue.dataToDownload,
				})
			} catch (err) {
				captureException(err)
			}

			if (savedToPath) {
				onSuccess({ dataDownloaded: parsedValue.dataToDownload, savedToPath })
			}
		},
	})

	const backIconSize = useIconSizeBasedOnTypography({
		variant: 'pageTitle',
		multiplier: 1.5,
	})

	const formId = useId()

	return (
		<>
			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Stack
					component="header"
					direction="row"
					sx={{
						alignItems: 'center',
						gap: 2,
						padding: 4,
						borderBottom: `1px solid ${BLUE_05}`,
					}}
				>
					<form.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<IconButton
								onClick={() => {
									if (isSubmitting) {
										return
									}
									onBack()
								}}
								sx={{ color: (theme) => theme.palette.text.secondary }}
							>
								<Icon name="material-arrow-back" size={backIconSize} />
							</IconButton>
						)}
					</form.Subscribe>

					<Typography variant="pageTitle">
						{intl.formatMessage(m.navTitle)}
					</Typography>
				</Stack>

				<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
					<Box
						component="form"
						id={formId}
						noValidate
						autoComplete="off"
						onSubmit={(event) => {
							event.preventDefault()
							if (form.state.isSubmitting) return
							form.handleSubmit()
						}}
						sx={{ flex: 1, overflow: 'auto', padding: 6 }}
					>
						<Stack direction="column" sx={{ gap: 10 }}>
							<form.AppField name="dataToDownload">
								{(field) => (
									<FormControl required>
										<RadioGroup
											name={field.name}
											value={field.state.value}
											onChange={(_event, value) => {
												field.handleChange(value)
											}}
											aria-label={intl.formatMessage(
												m.downloadOptionsAccessibleLabel,
											)}
											onBlur={field.handleBlur}
										>
											<Stack direction="column" sx={{ gap: 6 }}>
												<DownloadOption
													value="observations"
													primaryText={intl.formatMessage(
														m.allObservationsOptionTitle,
													)}
													secondaryText={intl.formatMessage(
														m.allObservationsOptionDescription,
													)}
												/>

												<DownloadOption
													value="observations-with-media"
													primaryText={intl.formatMessage(
														m.allObservationsWithMediaOptionTitle,
													)}
													secondaryText={intl.formatMessage(
														m.allObservationsWithMediaOptionDescription,
													)}
												/>

												<DownloadOption
													value="tracks"
													primaryText={intl.formatMessage(m.tracksOptionTitle)}
													secondaryText={intl.formatMessage(
														m.tracksOptionDescription,
													)}
												/>
											</Stack>
										</RadioGroup>
									</FormControl>
								)}
							</form.AppField>
						</Stack>
					</Box>

					<Box
						sx={{
							border: `1px solid ${BLUE_05}`,
							display: 'flex',
							flexDirection: 'row',
							justifyContent: 'center',
							padding: 6,
						}}
					>
						<form.Subscribe
							selector={(state) =>
								[state.canSubmit, state.isSubmitting] as const
							}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									form={formId}
									fullWidth
									variant="contained"
									loading={isSubmitting}
									loadingPosition="start"
									startIcon={<Icon name="material-file-download" />}
									aria-disabled={!canSubmit}
								>
									{intl.formatMessage(m.download)}
								</Button>
							)}
						</form.Subscribe>
					</Box>
				</Stack>
			</Stack>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={downloadData.status === 'error' ? downloadData.error : null}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							downloadData.reset()
						}}
					/>
				)}
			</DecentDialog>
		</>
	)
}

function DownloadOption({
	value,
	primaryText,
	secondaryText,
}: {
	value: DataToDownload
	primaryText: string
	secondaryText: string
}) {
	return (
		<Box sx={{ padding: 6, border: `1px solid ${BLUE_05}`, borderRadius: 2 }}>
			<FormControlLabel
				value={value}
				control={<Radio />}
				label={
					<Stack direction="column" sx={{ gap: 1 }}>
						<Typography variant="cardHeader">{primaryText}</Typography>

						<Typography aria-hidden>{secondaryText}</Typography>
					</Stack>
				}
				sx={{ gap: 2 }}
			/>
		</Box>
	)
}

const m = defineMessages<{
	readonly navTitle: NoMessageValues
	readonly download: NoMessageValues
	readonly allObservationsOptionTitle: NoMessageValues
	readonly allObservationsOptionDescription: NoMessageValues
	readonly allObservationsWithMediaOptionTitle: NoMessageValues
	readonly downloadOptionsAccessibleLabel: NoMessageValues
	readonly allObservationsWithMediaOptionDescription: NoMessageValues
	readonly tracksOptionTitle: NoMessageValues
	readonly tracksOptionDescription: NoMessageValues
	readonly selectDirectoryDialogActionLabel: NoMessageValues
	readonly successPanelTitle: NoMessageValues
	readonly successPanelDescriptionObservations: {
		readonly b: MessageTag
		readonly br: MessageTag
	}
	readonly successPanelDescriptionObservationsWithMedia: {
		readonly b: MessageTag
		readonly br: MessageTag
	}
	readonly successPanelDescriptionTracks: {
		readonly b: MessageTag
		readonly br: MessageTag
	}
	readonly successPanelViewInFileManager: NoMessageValues
	readonly successPanelDone: NoMessageValues
}>({
	navTitle: {
		id: '$1.routes.app.projects.$projectId.download.navTitle',
		defaultMessage: 'Download Observations',
		description: 'Title of the download observations page.',
	},
	download: {
		id: '$1.routes.app.projects.$projectId.download.download',
		defaultMessage: 'Download',
		description: 'Title of the download page.',
	},
	allObservationsOptionTitle: {
		id: '$1.routes.app.projects.$projectId.download.allObservationsOptionTitle',
		defaultMessage: 'All Observations',
		description: 'Title of the all observations download option.',
	},
	allObservationsOptionDescription: {
		id: '$1.routes.app.projects.$projectId.download.allObservationsOptionDescription',
		defaultMessage: 'Text only as a GeoJSON file',
		description: 'Description of the all observations download option.',
	},
	allObservationsWithMediaOptionTitle: {
		id: '$1.routes.app.projects.$projectId.download.allObservationsWithMedia',
		defaultMessage: 'All Observations with Media',
		description: 'Title of the all observations with media download option.',
	},
	downloadOptionsAccessibleLabel: {
		id: 'routes.app.projects.$projectId.download.downloadOptionsAccessibleLabel',
		defaultMessage: 'Data to download',
		description: 'Accessible label of download options form input.',
	},
	allObservationsWithMediaOptionDescription: {
		id: '$1.routes.app.projects.$projectId.download.allObservationsWithMediaOptionDescription',
		defaultMessage: 'Images and audio in a .zip file',
		description:
			'Description of the all observations with media download option.',
	},
	tracksOptionTitle: {
		id: '$1.routes.app.projects.$projectId.download.tracksOptionTitle',
		defaultMessage: 'Tracks',
		description: 'Title of the tracks option.',
	},
	tracksOptionDescription: {
		id: '$1.routes.app.projects.$projectId.download.tracksOptionDescription',
		defaultMessage: 'Text only as a GeoJSON file',
		description: 'Description of tracks option.',
	},
	selectDirectoryDialogActionLabel: {
		id: '$1.routes.app.projects.$projectId.download.selectDirectoryDialogActionLabel',
		defaultMessage: 'Select',
		description:
			'Text used for action button in system dialog for selecting directory to use for download.',
	},
	successPanelTitle: {
		id: '$1.routes.app.projects.$projectId.download.successPanelTitle',
		defaultMessage: 'Success!',
		description: 'Title text for success panel.',
	},
	successPanelDescriptionObservations: {
		id: '$1.routes.app.projects.$projectId.download.successPanelDescriptionObservations',
		defaultMessage:
			'<b>All observations</b><br></br> have been downloaded to your device.',
		description:
			'Description text for success panel when downloading observations.',
	},
	successPanelDescriptionObservationsWithMedia: {
		id: '$1.routes.app.projects.$projectId.download.successPanelDescriptionObservationsWithMedia',
		defaultMessage:
			'<b>All observations with media</b><br></br> have been downloaded to your device.',
		description:
			'Description text for success panel when downloading observations with media.',
	},
	successPanelDescriptionTracks: {
		id: '$1.routes.app.projects.$projectId.download.successPanelDescriptionTracks',
		defaultMessage:
			'<b>All tracks</b><br></br> have been downloaded to your device.',
		description: 'Description text for success panel when downloading tracks.',
	},
	successPanelViewInFileManager: {
		id: '$1.routes.app.projects.$projectId.download.successPanelViewInFileManager',
		defaultMessage: 'View in file manager',
		description:
			'Button text for viewing the downloaded file in the system file manager.',
	},
	successPanelDone: {
		id: '$1.routes.app.projects.$projectId.download.successPanelDone',
		defaultMessage: 'Done',
		description: 'Button text for exiting success panel.',
	},
})
