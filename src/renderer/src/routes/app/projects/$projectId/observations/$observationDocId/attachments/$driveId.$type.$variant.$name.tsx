import { Suspense } from 'react'
import { useAttachmentUrl } from '@comapeo/core-react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { PhotoAttachmentImage } from '../-components/photo-attachment-image'
import { BLUE_GREY, LIGHT_GREY } from '../../../../../../../colors'
import { ErrorBoundary } from '../../../../../../../components/error-boundary'
import { ErrorDialog } from '../../../../../../../components/error-dialog'
import { Icon } from '../../../../../../../components/icon'
import { createGlobalMutationsKey } from '../../../../../../../lib/queries/global-mutations'
import { downloadURLMutationOptions } from '../../../../../../../lib/queries/system'

const BlobIdSchema = v.variant('type', [
	v.object({
		type: v.literal('photo'),
		variant: v.union([
			v.literal('original'),
			v.literal('preview'),
			v.literal('thumbnail'),
		]),
		driveId: v.string(),
		name: v.string(),
	}),
	v.object({
		// TODO: Support video type
		type: v.literal('audio'),
		variant: v.literal('original'),
		driveId: v.string(),
		name: v.string(),
	}),
])

type BlobId = v.InferOutput<typeof BlobIdSchema>

export const Route = createFileRoute(
	'/app/projects/$projectId/observations/$observationDocId/attachments/$driveId/$type/$variant/$name',
)({
	params: {
		parse: ({ driveId, type, variant, name, ...rest }) => {
			const blobId = v.parse(BlobIdSchema, {
				driveId,
				type,
				variant,
				name,
			})

			return { ...rest, ...blobId }
		},
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const router = useRouter()

	const { projectId, ...blobId } = Route.useParams()

	const errorResetKey = `${blobId.driveId}/${blobId.type}/${blobId.variant}/${blobId.name}`

	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Stack
				direction="row"
				alignItems="center"
				component="nav"
				gap={4}
				padding={4}
				borderBottom={`1px solid ${BLUE_GREY}`}
			>
				<IconButton
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({
							to: '/app/projects/$projectId',
							params: { projectId },
							replace: true,
						})
					}}
				>
					<Icon name="material-arrow-back" size={30} />
				</IconButton>

				<Typography
					variant="h1"
					fontWeight={500}
					id="coordinate-system-selection-label"
				>
					{t(blobId.type === 'photo' ? m.photoNavTitle : m.audioNavTitle)}
				</Typography>
			</Stack>

			<Stack
				direction="column"
				flex={1}
				justifyContent="space-between"
				overflow="auto"
				padding={6}
				gap={6}
			>
				<Stack direction="column" gap={6}>
					{blobId.type === 'audio' ? (
						<Alert
							severity="warning"
							icon={<Icon name="material-warning-rounded" />}
							sx={{
								border: `1px solid ${BLUE_GREY}`,
								borderRadius: 2,
							}}
						>
							<Typography>{t(m.playerUnavailable)}</Typography>
						</Alert>
					) : null}

					{blobId.type === 'photo' ? (
						<ErrorBoundary
							getResetKey={() => errorResetKey}
							fallback={() => (
								<Box
									display="grid"
									sx={{
										aspectRatio: 1,
										border: `1px solid ${BLUE_GREY}`,
										borderRadius: 2,
										placeItems: 'center',
									}}
								>
									<Icon name="material-error" size={80} color="error" />
								</Box>
							)}
						>
							<Suspense
								fallback={
									<Box
										display="grid"
										sx={{
											aspectRatio: 1,
											border: `1px solid ${BLUE_GREY}`,
											borderRadius: 2,
											placeItems: 'center',
										}}
									>
										<CircularProgress disableShrink size={30} />
									</Box>
								}
							>
								<Box
									display="flex"
									flexDirection="column"
									flex={1}
									overflow="hidden"
									sx={{
										border: `1px solid ${BLUE_GREY}`,
										borderRadius: 2,
									}}
								>
									<PhotoAttachmentImage
										attachmentDriveId={blobId.driveId}
										attachmentName={blobId.name}
										projectId={projectId}
									/>
								</Box>
							</Suspense>
						</ErrorBoundary>
					) : (
						<Box
							display="flex"
							flexDirection="row"
							alignItems="center"
							flex={1}
							sx={{
								border: `1px solid ${BLUE_GREY}`,
								borderRadius: 4,
								aspectRatio: 1,
							}}
						>
							<Stack direction="column" gap={4} flex={1} alignItems="center">
								<Box>
									<Icon
										name="material-play-arrow-filled"
										size={160}
										htmlColor={LIGHT_GREY}
									/>
								</Box>

								<Box
									alignSelf="stretch"
									height={8}
									bgcolor={LIGHT_GREY}
									marginX="20%"
								/>
							</Stack>
						</Box>
					)}
				</Stack>

				<ErrorBoundary getResetKey={() => errorResetKey} fallback={() => <></>}>
					<Suspense>
						<DownloadButton projectId={projectId} blobId={blobId} />
					</Suspense>
				</ErrorBoundary>
			</Stack>
		</Stack>
	)
}

const DOWNLOAD_MUTATION_KEY = createGlobalMutationsKey(['download', 'url'])

function DownloadButton({
	projectId,
	blobId,
}: {
	projectId: string
	blobId: BlobId
}) {
	const { formatMessage: t } = useIntl()

	const { data: attachmentUrl } = useAttachmentUrl({
		projectId,
		blobId,
	})

	const downloadUrl = useMutation({
		...downloadURLMutationOptions(),
		mutationKey: DOWNLOAD_MUTATION_KEY,
	})

	return (
		<>
			<Stack
				direction="column"
				gap={2}
				justifyContent="center"
				alignItems="center"
			>
				<IconButton
					aria-labelledBy="download-button-label"
					sx={{ border: `1px solid ${BLUE_GREY}` }}
					onClick={() => {
						if (downloadUrl.status === 'pending') {
							return
						}

						downloadUrl.mutate({ url: attachmentUrl, saveAs: true })
					}}
				>
					<Icon name="material-file-download" />
				</IconButton>

				<Typography id="download-button-label">{t(m.download)}</Typography>
			</Stack>

			<ErrorDialog
				open={downloadUrl.status === 'error'}
				errorMessage={downloadUrl?.error?.toString()}
				onClose={() => {
					downloadUrl.reset()
				}}
			/>
		</>
	)
}

const m = defineMessages({
	photoNavTitle: {
		id: 'routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.photoNavTitle',
		defaultMessage: 'Photo Info',
		description: 'Title of the photo attachment page.',
	},
	audioNavTitle: {
		id: 'routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.audioNavTitle',
		defaultMessage: 'Audio Recording',
		description: 'Title of the audio attachment page.',
	},
	playerUnavailable: {
		id: 'routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.playerUnavailable',
		defaultMessage: 'Player unavailable. Download file to preview.',
		description: 'Alert text indicating inability to play audio attachment.',
	},
	download: {
		id: 'routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.download',
		defaultMessage: 'Download',
		description: 'Label text for download button',
	},
})
