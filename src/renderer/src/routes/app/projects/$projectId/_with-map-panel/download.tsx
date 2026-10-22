import { useId } from 'react'
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

const onChangeSchema = v.object({ dataToDownload: DataToDownloadSchema })

function RouteComponent() {
	const intl = useIntl()

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

	const { data: language } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: (localeState) => {
			return localeState.value
		},
	})

	const exportGeoJSON = useExportGeoJSON({ projectId })
	const exportZipFile = useExportZipFile({ projectId })
	const selectDirectory = useMutation(selectDirectoryMutationOptions())
	const showItemInFolder = useMutation(showItemInFolderMutationOptions())

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
						lang: language,
						observations: true,
						tracks: false,
					},
				})
			}

			return exportGeoJSON.mutateAsync({
				path: selectDirectoryResult.path,
				exportOptions: {
					lang: language,
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

			try {
				await downloadData.mutateAsync({
					dataToDownload: parsedValue.dataToDownload,
				})
			} catch (err) {
				captureException(err)
			}
		},
	})

	const backIconSize = useIconSizeBasedOnTypography({
		variant: 'pageTitle',
		multiplier: 1.5,
	})

	const successIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 3,
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
									navigateBack()
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
									aria-disabled={!canSubmit}
									form={formId}
									fullWidth
									loading={isSubmitting}
									loadingPosition="start"
									startIcon={<Icon name="material-file-download" />}
									type="submit"
									variant="contained"
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

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					downloadData.status === 'success' && downloadData.data
						? {
								downloadedOption: downloadData.variables.dataToDownload,
								savedToPath: downloadData.data,
							}
						: null
				}
			>
				{({ downloadedOption, savedToPath }) => {
					const descriptionText = intl.formatMessage(
						downloadedOption === 'observations'
							? m.successDialogDescriptionObservations
							: downloadedOption === 'observations-with-media'
								? m.successDialogDescriptionObservationsWithMedia
								: m.successDialogDescriptionTracks,
						{ b: Bold, br: Break },
					)

					return (
						<Stack direction="column" sx={{ overflow: 'auto' }}>
							<Stack
								direction="column"
								sx={{ gap: 10, flex: 1, overflow: 'auto', padding: 20 }}
							>
								<Stack direction="column" sx={{ alignItems: 'center', gap: 4 }}>
									<Icon
										color="success"
										name="material-check-circle-rounded"
										size={successIconSize}
									/>

									<Typography
										component="h1"
										variant="heroHeader"
										sx={{ textAlign: 'center' }}
									>
										{intl.formatMessage(m.successDialogTitle)}
									</Typography>
								</Stack>

								<Typography
									variant="heroSubheading"
									sx={{ textAlign: 'center' }}
								>
									{descriptionText}
								</Typography>
							</Stack>

							<Stack
								direction="row"
								sx={{
									alignItems: 'center',
									flexWrap: 'wrap',
									gap: 4,
									justifyContent: 'center',
									padding: 6,
								}}
							>
								<Button
									fullWidth
									onClick={() => {
										downloadData.reset()
									}}
									startIcon={<Icon name="material-symbols-cancel" />}
									variant="outlined"
								>
									{intl.formatMessage(m.successDialogClose)}
								</Button>

								<Button
									fullWidth
									onClick={() => {
										showItemInFolder.mutate(savedToPath)
									}}
									startIcon={<Icon name="material-symbols-folder-open" />}
									variant="contained"
								>
									{intl.formatMessage(m.successDialogViewFile)}
								</Button>
							</Stack>
						</Stack>
					)
				}}
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
	readonly successDialogTitle: NoMessageValues
	readonly successDialogDescriptionObservations: {
		readonly b: MessageTag
		readonly br: MessageTag
	}
	readonly successDialogDescriptionObservationsWithMedia: {
		readonly b: MessageTag
		readonly br: MessageTag
	}
	readonly successDialogDescriptionTracks: {
		readonly b: MessageTag
		readonly br: MessageTag
	}
	readonly successDialogViewFile: NoMessageValues
	readonly successDialogClose: NoMessageValues
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
	successDialogTitle: {
		id: '$1.routes.app.projects.$projectId.download.successDialogTitle',
		defaultMessage: 'Success!',
		description: 'Title text for success panel.',
	},
	successDialogDescriptionObservations: {
		id: '$1.routes.app.projects.$projectId.download.successDialogDescriptionObservations',
		defaultMessage:
			'<b>All observations</b><br></br> have been downloaded to your device.',
		description:
			'Description text for success panel when downloading observations.',
	},
	successDialogDescriptionObservationsWithMedia: {
		id: '$1.routes.app.projects.$projectId.download.successDialogDescriptionObservationsWithMedia',
		defaultMessage:
			'<b>All observations with media</b><br></br> have been downloaded to your device.',
		description:
			'Description text for success panel when downloading observations with media.',
	},
	successDialogDescriptionTracks: {
		id: '$1.routes.app.projects.$projectId.download.successDialogDescriptionTracks',
		defaultMessage:
			'<b>All tracks</b><br></br> have been downloaded to your device.',
		description: 'Description text for success panel when downloading tracks.',
	},
	successDialogViewFile: {
		id: '$1.routes.app.projects.$projectId.download.successDialogViewFile',
		defaultMessage: 'Open File Manager',
		description:
			'Button text for viewing the downloaded file in the system file manager.',
	},
	successDialogClose: {
		id: '$1.routes.app.projects.$projectId.download.successDialogClose',
		defaultMessage: 'Close',
		description: 'Button text for closing the success dialog.',
	},
})
