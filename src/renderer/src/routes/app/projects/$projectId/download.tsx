import { useState } from 'react'
import { useExportGeoJSON, useExportZipFile } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
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
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { BLUE_GREY, DARK_GREY, GREEN } from '#renderer/src/colors.ts'
import { ErrorDialog } from '#renderer/src/components/error-dialog.tsx'
import { Icon } from '#renderer/src/components/icon.tsx'
import { useAppForm } from '#renderer/src/hooks/forms.ts'
import { getLocaleStateQueryOptions } from '#renderer/src/lib/queries/app-settings.ts'
import { selectDirectoryMutationOptions } from '#renderer/src/lib/queries/file-system.ts'
import { createGlobalMutationsKey } from '#renderer/src/lib/queries/global-mutations.ts'
import { showItemInFolderMutationOptions } from '#renderer/src/lib/queries/system.ts'

export const Route = createFileRoute('/app/projects/$projectId/download')({
	component: RouteComponent,
})

const FORM_ID = 'download-data-form'

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
	const { formatMessage: t } = useIntl()

	const showItemInFolder = useMutation(showItemInFolderMutationOptions())

	return (
		<Stack
			direction="column"
			flex={1}
			overflow="auto"
			justifyContent="space-between"
		>
			<Container maxWidth="xs">
				<Stack
					direction="column"
					padding={6}
					alignItems="center"
					flex={1}
					gap={6}
				>
					<Box padding={6}>
						<Icon
							name="material-check-circle-rounded"
							htmlColor={GREEN}
							size={160}
						/>
					</Box>

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.successPanelTitle)}
					</Typography>

					<Typography component="p" variant="h2" textAlign="center">
						{t(
							dataDownloaded === 'observations'
								? m.successPanelDescriptionObservations
								: dataDownloaded === 'observations-with-media'
									? m.successPanelDescriptionObservationsWithMedia
									: m.successPanelDescriptionTracks,
						)}
					</Typography>

					<Button
						variant="text"
						sx={{ maxWidth: 400 }}
						onClick={() => {
							showItemInFolder.mutate(savedToPath)
						}}
					>
						{t(m.successPanelViewInFileManager)}
					</Button>
				</Stack>
			</Container>

			<Box
				display="flex"
				flexDirection="column"
				gap={4}
				paddingX={6}
				paddingBottom={6}
				position="sticky"
				bottom={0}
				alignItems="center"
				zIndex={1}
			>
				<Button
					fullWidth
					sx={{ maxWidth: 400 }}
					onClick={() => {
						onDone()
					}}
				>
					{t(m.successPanelDone)}
				</Button>
			</Box>
		</Stack>
	)
}

const onChangeSchema = v.object({
	dataToDownload: DataToDownloadSchema,
})

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
	const { formatMessage: t } = useIntl()

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
			const selectDirectoryResult = await selectDirectory.mutateAsync(undefined)

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
		validators: {
			onChange: onChangeSchema,
		},
		onSubmit: async ({ value }) => {
			const parsedValue = v.parse(onChangeSchema, value)

			const savedToPath = await downloadData.mutateAsync({
				dataToDownload: parsedValue.dataToDownload,
			})

			if (savedToPath) {
				onSuccess({ dataDownloaded: parsedValue.dataToDownload, savedToPath })
			}
		},
	})

	return (
		<>
			<Stack direction="column" flex={1} overflow="auto">
				<Stack
					direction="row"
					alignItems="center"
					component="nav"
					gap={4}
					padding={4}
					borderBottom={`1px solid ${BLUE_GREY}`}
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
							>
								<Icon name="material-arrow-back" size={30} />
							</IconButton>
						)}
					</form.Subscribe>

					<Typography variant="h1" fontWeight={500}>
						{t(m.navTitle)}
					</Typography>
				</Stack>

				<Stack
					direction="column"
					flex={1}
					justifyContent="space-between"
					overflow="auto"
				>
					<Box padding={6}>
						<Box
							component="form"
							id={FORM_ID}
							noValidate
							autoComplete="off"
							onSubmit={(event) => {
								event.preventDefault()
								if (form.state.isSubmitting) return
								form.handleSubmit().catch((err) => {
									captureException(err)
								})
							}}
						>
							<Stack direction="column" gap={10}>
								<form.AppField name="dataToDownload">
									{(field) => (
										<FormControl required>
											<RadioGroup
												name={field.name}
												value={field.state.value}
												onChange={(_event, value) => {
													field.handleChange(value)
												}}
												aria-label={t(m.downloadOptionsAccessibleLabel)}
												onBlur={field.handleBlur}
											>
												<Stack direction="column" gap={6}>
													<DownloadOption
														value="observations"
														primaryText={t(m.allObservationsOptionTitle)}
														secondaryText={t(
															m.allObservationsOptionDescription,
														)}
													/>

													<DownloadOption
														value="observations-with-media"
														primaryText={t(
															m.allObservationsWithMediaOptionTitle,
														)}
														secondaryText={t(
															m.allObservationsWithMediaOptionDescription,
														)}
													/>

													<DownloadOption
														value="tracks"
														primaryText={t(m.tracksOptionTitle)}
														secondaryText={t(m.tracksOptionDescription)}
													/>
												</Stack>
											</RadioGroup>
										</FormControl>
									)}
								</form.AppField>
							</Stack>
						</Box>
					</Box>

					<Box
						display="flex"
						flexDirection="column"
						gap={4}
						paddingX={6}
						paddingBottom={6}
						position="sticky"
						bottom={0}
						alignItems="center"
						zIndex={1}
					>
						<form.Subscribe
							selector={(state) =>
								[state.canSubmit, state.isSubmitting] as const
							}
						>
							{([canSubmit, isSubmitting]) => (
								<form.SubmitButton
									type="submit"
									form={FORM_ID}
									fullWidth
									variant="contained"
									loading={isSubmitting}
									loadingPosition="start"
									startIcon={<Icon name="material-file-download" />}
									aria-disabled={!canSubmit}
									sx={{ maxWidth: 400 }}
								>
									{t(m.download)}
								</form.SubmitButton>
							)}
						</form.Subscribe>
					</Box>
				</Stack>
			</Stack>

			<ErrorDialog
				open={downloadData.status === 'error'}
				errorMessage={downloadData.error?.toString()}
				onClose={() => {
					downloadData.reset()
				}}
			/>
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
		<Box padding={6} border={`1px solid ${BLUE_GREY}`} borderRadius={2}>
			<FormControlLabel
				value={value}
				control={<Radio />}
				label={
					<Stack direction="column">
						<Typography fontWeight={500}>{primaryText}</Typography>
						<Typography color={DARK_GREY} aria-hidden>
							{secondaryText}
						</Typography>
					</Stack>
				}
			/>
		</Box>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId.download.navTitle',
		defaultMessage: 'Download Observations',
		description: 'Title of the download observations page.',
	},
	download: {
		id: 'routes.app.projects.$projectId.download.download',
		defaultMessage: 'Download',
		description: 'Title of the download page.',
	},
	allObservationsOptionTitle: {
		id: 'routes.app.projects.$projectId.download.allObservationsOptionTitle',
		defaultMessage: 'All Observations',
		description: 'Title of the all observations download option.',
	},
	allObservationsOptionDescription: {
		id: 'routes.app.projects.$projectId.download.allObservationsOptionDescription',
		defaultMessage: 'Text only as a GeoJSON file',
		description: 'Description of the all observations download option.',
	},
	allObservationsWithMediaOptionTitle: {
		id: 'routes.app.projects.$projectId.download.allObservationsWithMedia',
		defaultMessage: 'All Observations with Media',
		description: 'Title of the all observations with media download option.',
	},
	downloadOptionsAccessibleLabel: {
		id: 'routes.app.projects.$projectId.download.downloadOptionsAccessibleLabel',
		defaultMessage: 'Data to download',
		description: 'Accessible label of download options form input.',
	},
	allObservationsWithMediaOptionDescription: {
		id: 'routes.app.projects.$projectId.download.allObservationsWithMediaOptionDescription',
		defaultMessage: 'Images, audio, and video in a .zip file',
		description:
			'Description of the all observations with media download option.',
	},
	tracksOptionTitle: {
		id: 'routes.app.projects.$projectId.download.tracksOptionTitle',
		defaultMessage: 'Tracks',
		description: 'Title of the tracks option.',
	},
	tracksOptionDescription: {
		id: 'routes.app.projects.$projectId.download.tracksOptionDescription',
		defaultMessage: 'Text only as a GeoJSON file',
		description: 'Description of tracks option.',
	},
	successPanelTitle: {
		id: 'routes.app.projects.$projectId.download.successPanelTitle',
		defaultMessage: 'Success!',
		description: 'Title text for success panel.',
	},
	successPanelDescriptionObservations: {
		id: 'routes.app.projects.$projectId.download.successPanelDescriptionObservations',
		defaultMessage:
			'<b>All observations</b><br></br> have been downloaded to your device.',
		description:
			'Description text for success panel when downloading observations.',
	},
	successPanelDescriptionObservationsWithMedia: {
		id: 'routes.app.projects.$projectId.download.successPanelDescriptionObservationsWithMedia',
		defaultMessage:
			'<b>All observations with media</b><br></br> have been downloaded to your device.',
		description:
			'Description text for success panel when downloading observations with media.',
	},
	successPanelDescriptionTracks: {
		id: 'routes.app.projects.$projectId.download.successPanelDescriptionTracks',
		defaultMessage:
			'<b>All tracks</b><br></br> have been downloaded to your device.',
		description: 'Description text for success panel when downloading tracks.',
	},
	successPanelViewInFileManager: {
		id: 'routes.app.projects.$projectId.download.successPanelViewInFileManager',
		defaultMessage: 'View in file manager',
		description:
			'Button text for viewing the downloaded file in the system file manager.',
	},
	successPanelDone: {
		id: 'routes.app.projects.$projectId.download.successPanelDone',
		defaultMessage: 'Done',
		description: 'Button text for exiting success panel.',
	},
})
