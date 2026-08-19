import { Suspense, useState } from 'react'
import {
	useAttachmentUrl,
	useOwnDeviceInfo,
	useOwnRoleInProject,
	useSingleDocByDocId,
	useUpdateDocument,
} from '@comapeo/core-react'
import type { Observation } from '@comapeo/core/schema.js'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { styled, type SxProps, type Theme } from '@mui/material/styles'
import { captureMessage } from '@sentry/react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
	MediaController,
	MediaPlayButton,
	MediaTimeDisplay,
	MediaTimeRange,
} from 'media-chrome/react'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { PhotoAttachmentImage } from '../-components/photo-attachment-image.tsx'
import {
	BLACK,
	BLUE_GREY,
	COMAPEO_BLUE,
	GREEN,
	WHITE,
} from '../../../../../../../../colors.ts'
import { DecentDialog } from '../../../../../../../../components/decent-dialog.tsx'
import { ErrorBoundary } from '../../../../../../../../components/error-boundary.tsx'
import { ErrorDialogContent } from '../../../../../../../../components/error-dialog.tsx'
import { Icon } from '../../../../../../../../components/icon.tsx'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../../../../../lib/comapeo.ts'
import { getLocaleStateQueryOptions } from '../../../../../../../../lib/queries/app-settings.ts'
import { createGlobalMutationsKey } from '../../../../../../../../lib/queries/global-mutations.ts'
import { downloadURLMutationOptions } from '../../../../../../../../lib/queries/system.ts'

// TODO: Support video type
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
		type: v.literal('audio'),
		variant: v.literal('original'),
		driveId: v.string(),
		name: v.string(),
	}),
])

type BlobId = v.InferOutput<typeof BlobIdSchema>

export const Route = createFileRoute(
	'/app/projects/$projectId/_main-tabs/observations/$observationDocId/attachments/$driveId/$type/$variant/$name',
)({
	params: {
		parse: ({ driveId, type, variant, name, ...rest }) => {
			const blobId = v.parse(BlobIdSchema, { driveId, type, variant, name })

			return { ...rest, ...blobId }
		},
	},
	beforeLoad: async ({ context, params }) => {
		const {
			localeState: { value: lang },
			projectApi,
			queryClient,
		} = context

		const { projectId, observationDocId, driveId, type, name } = params

		const observation = await queryClient.ensureQueryData({
			queryKey: [
				COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
				'projects',
				projectId,
				'observation',
				observationDocId,
				{ lang },
			],
			queryFn: async () => {
				return projectApi.observation.getByDocId(observationDocId, { lang })
			},
		})

		// TODO: Throw not found instead?
		if (
			!observation.attachments.find((a) => {
				return (
					a.driveDiscoveryId === driveId && a.type === type && a.name === name
				)
			})
		) {
			throw Route.redirect({
				to: '/app/projects/$projectId/observations/$observationDocId',
				params: { projectId, observationDocId },
			})
		}
	},
	loader: async ({ context, params }) => {
		const { clientApi, projectApi, queryClient } = context

		const { projectId } = params

		await Promise.all([
			queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
				queryFn: async () => {
					return clientApi.getDeviceInfo()
				},
			}),
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'role',
				],
				queryFn: async () => {
					return projectApi.$getOwnRole()
				},
			}),
		])
	},
	component: RouteComponent,
})

function RouteComponent() {
	const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)

	const { projectId, observationDocId, ...blobId } = Route.useParams()

	return showDeleteSuccess ? (
		<DeleteSuccessPanel
			projectId={projectId}
			observationDocId={observationDocId}
			type={blobId.type}
		/>
	) : (
		<AttachmentPanel
			blobId={blobId}
			observationDocId={observationDocId}
			onDeleteSuccess={() => {
				setShowDeleteSuccess(true)
			}}
			projectId={projectId}
		/>
	)
}

function DeleteSuccessPanel({
	projectId,
	observationDocId,
	type,
}: {
	projectId: string
	observationDocId: string
	type: BlobId['type']
}) {
	const { formatMessage: t } = useIntl()

	const router = useRouter()

	return (
		<Stack
			direction="column"
			sx={{ flex: 1, overflow: 'auto', justifyContent: 'space-between' }}
		>
			<Container maxWidth="xs">
				<Stack
					direction="column"
					sx={{ padding: 6, alignItems: 'center', flex: 1, gap: 6 }}
				>
					<Box sx={{ padding: 6 }}>
						<Icon
							name="material-check-circle-rounded"
							htmlColor={GREEN}
							size={160}
						/>
					</Box>

					<Typography
						variant="h1"
						sx={{ fontWeight: 500, textAlign: 'center' }}
					>
						{t(m.deleteSuccessPanelTitle, { type })}
					</Typography>
				</Stack>
			</Container>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 4,
					paddingX: 6,
					paddingBottom: 6,
					position: 'sticky',
					bottom: 0,
					alignItems: 'center',
					zIndex: 1,
				}}
			>
				<Button
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({
							to: '/app/projects/$projectId/observations/$observationDocId',
							params: { projectId, observationDocId },
							replace: true,
						})
					}}
					fullWidth
					variant="outlined"
					sx={{ maxWidth: 400 }}
				>
					{t(m.returnToObservation)}
				</Button>
			</Box>
		</Stack>
	)
}

const BASE_SQUARE_ATTACHMENT_CONTAINER_STYLE: SxProps<Theme> = {
	alignItems: 'center',
	border: `1px solid ${BLUE_GREY}`,
	borderRadius: 4,
	display: 'flex',
	flexDirection: 'row',
	height: 400,
	justifyContent: 'center',
	padding: 6,
	width: 400,
} as const

function AttachmentPanel({
	blobId,
	observationDocId,
	onDeleteSuccess,
	projectId,
}: {
	blobId: BlobId
	observationDocId: string
	onDeleteSuccess: () => void
	projectId: string
}) {
	const intl = useIntl()

	const router = useRouter()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: (state) => {
			return state.value
		},
	})

	const { data: observation } = useSingleDocByDocId({
		projectId,
		docType: 'observation',
		docId: observationDocId,
		lang,
	})

	const { data: ownRole } = useOwnRoleInProject({ projectId })
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const errorResetKey = `${blobId.driveId}/${blobId.type}/${blobId.variant}/${blobId.name}`

	const canEdit =
		ownRole.roleId === COORDINATOR_ROLE_ID ||
		ownRole.roleId === CREATOR_ROLE_ID ||
		observation.createdBy === ownDeviceInfo.deviceId

	// NOTE: Okay to do non-null assertion here because
	// existence check is done in beforeLoad
	const attachment = observation.attachments.find((a) => {
		return (
			a.driveDiscoveryId === blobId.driveId &&
			a.type === blobId.type &&
			a.name === blobId.name
		)
	})!

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				direction="row"
				component="nav"
				sx={{
					alignItems: 'center',
					gap: 4,
					padding: 4,
					borderBottom: `1px solid ${BLUE_GREY}`,
				}}
			>
				<IconButton
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({
							to: '/app/projects/$projectId/observations/$observationDocId',
							params: { projectId, observationDocId },
							replace: true,
						})
					}}
				>
					<Icon name="material-arrow-back" size={30} />
				</IconButton>

				<Typography variant="h1" sx={{ fontWeight: 500 }}>
					{intl.formatMessage(
						blobId.type === 'photo' ? m.photoNavTitle : m.audioNavTitle,
					)}
				</Typography>
			</Stack>

			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Box
					sx={{
						display: 'flex',
						flex: 1,
						flexDirection: 'row',
						justifyContent: 'center',
						overflow: 'auto',
						padding: 6,
					}}
				>
					<ErrorBoundary
						getResetKey={() => errorResetKey}
						onError={(error) => {
							captureMessage(
								`Failed to load ${blobId.variant} ${blobId.type === 'photo' ? 'image' : 'audio'}`,
								{ level: 'info', extra: blobId },
							)

							console.error(error)
						}}
						// TODO: Consider redirecting to other variants recursively for image blobs
						fallback={() => (
							<Box sx={BASE_SQUARE_ATTACHMENT_CONTAINER_STYLE}>
								<Icon name="material-error" size={80} color="error" />
							</Box>
						)}
					>
						<Suspense
							fallback={
								<Box sx={BASE_SQUARE_ATTACHMENT_CONTAINER_STYLE}>
									<CircularProgress disableShrink size={30} />
								</Box>
							}
						>
							{blobId.type === 'photo' ? (
								<PhotoAttachmentImage
									attachmentDriveId={blobId.driveId}
									attachmentName={blobId.name}
									attachmentVariant={blobId.variant}
									projectId={projectId}
									style={{
										border: `1px solid ${BLUE_GREY}`,
										borderRadius: 4,
										margin: 'auto',
										maxHeight: '100%',
										maxWidth: '100%',
									}}
								/>
							) : (
								<AudioPlayback
									blobId={blobId}
									createdAt={attachment.createdAt}
									lang={lang}
									projectId={projectId}
								/>
							)}
						</Suspense>
					</ErrorBoundary>
				</Box>

				<ErrorBoundary getResetKey={() => errorResetKey} fallback={() => <></>}>
					<Suspense>
						<Stack
							direction="row"
							sx={{
								borderTop: `1px solid ${BLUE_GREY}`,
								flexWrap: 'wrap',
								gap: 6,
								justifyContent: 'space-around',
								padding: 6,
							}}
						>
							{canEdit ? (
								<DeleteButton
									projectId={projectId}
									observation={observation}
									blobId={blobId}
									onSuccess={onDeleteSuccess}
								/>
							) : null}

							<DownloadButton projectId={projectId} blobId={blobId} />
						</Stack>
					</Suspense>
				</ErrorBoundary>
			</Stack>
		</Stack>
	)
}

const StyledMediaController = styled(MediaController)(({ theme }) => ({
	'--media-background-color': WHITE,
	'--media-control-hover-background': theme.palette.action.hover,
	'--media-focus-box-shadow': `inset 0 0 0 2px ${COMAPEO_BLUE}`,
	'--media-font-family': 'Rubik Variable, sans-serif',
	'--media-primary-color': BLACK,
	'--media-secondary-color': WHITE,
	padding: theme.spacing(2),
}))

const StyledMediaPlayButton = styled(MediaPlayButton)(() => ({
	'--media-control-height': '128px',
	alignSelf: 'center',
}))

const StyledMediaTimeRange = styled(MediaTimeRange)(() => ({
	'--media-range-bar-color': COMAPEO_BLUE,
	'--media-range-thumb-background': COMAPEO_BLUE,
	'--media-range-thumb': COMAPEO_BLUE,
	'--media-range-track-background': BLUE_GREY,
	'--media-range-track-border-radius': '8px',
	width: '100%',
}))

const StyledMediaTimeDisplay = styled(MediaTimeDisplay)(() => ({
	'--media-font-weight': 500,
}))

function AudioPlayback({
	blobId,
	createdAt,
	lang,
	projectId,
}: {
	blobId: BlobId
	createdAt: string | undefined
	lang: string
	projectId: string
}) {
	const intl = useIntl()

	const { data: attachmentUrl } = useAttachmentUrl({ projectId, blobId })

	return (
		<Box sx={BASE_SQUARE_ATTACHMENT_CONTAINER_STYLE}>
			<Stack direction="column" sx={{ flex: 1, gap: 4 }}>
				<StyledMediaController audio lang={lang}>
					<audio slot="media" src={attachmentUrl}></audio>

					<Stack direction="column" sx={{ gap: 2 }}>
						<StyledMediaPlayButton noTooltip />

						<StyledMediaTimeRange>
							<span slot="preview" />
						</StyledMediaTimeRange>

						<StyledMediaTimeDisplay noToggle showDuration />
					</Stack>
				</StyledMediaController>

				{createdAt ? (
					<Typography
						color="textSecondary"
						variant="body2"
						sx={{ textAlign: 'center', textWrap: 'balance' }}
					>
						<time dateTime={createdAt}>
							{intl.formatDate(createdAt, {
								year: 'numeric',
								month: 'short',
								day: '2-digit',
								minute: '2-digit',
								hour: '2-digit',
								hourCycle: 'h12',
							})}
						</time>
					</Typography>
				) : null}
			</Stack>
		</Box>
	)
}

const DELETE_ATTACHMENT_MUTATION_KEY = createGlobalMutationsKey([
	'attachments',
	'delete',
])

function DeleteButton({
	blobId,
	observation,
	onSuccess,
	projectId,
}: {
	blobId: BlobId
	observation: Observation
	onSuccess: () => void
	projectId: string
}) {
	const [showConfirmation, setShowConfirmation] = useState(false)

	const { formatMessage: t } = useIntl()

	const updateObservation = useUpdateDocument({
		projectId,
		docType: 'observation',
	})

	const deleteAttachment = useMutation({
		mutationKey: DELETE_ATTACHMENT_MUTATION_KEY,
		mutationFn: async ({ blobId }: { blobId: BlobId }) => {
			const updatedAttachments = observation.attachments.filter((a) => {
				return !(
					a.driveDiscoveryId === blobId.driveId &&
					a.name === blobId.name &&
					a.type === blobId.type
				)
			})

			await updateObservation.mutateAsync({
				versionId: observation.versionId,
				value: { ...observation, attachments: updatedAttachments },
			})
		},
	})

	return (
		<>
			<Stack
				direction="column"
				sx={{ gap: 2, justifyContent: 'center', alignItems: 'center' }}
			>
				<IconButton
					aria-labelledby="delete-button-label"
					sx={{ border: `1px solid ${BLUE_GREY}` }}
					onClick={() => {
						setShowConfirmation(true)
					}}
				>
					<Icon name="material-symbols-delete" />
				</IconButton>

				<Typography id="delete-button-label">{t(m.delete)}</Typography>
			</Stack>

			<DeleteAttachmentConfirmationDialog
				open={showConfirmation}
				onCancel={() => {
					setShowConfirmation(false)
				}}
				onConfirm={() => {
					deleteAttachment.mutate(
						{ blobId },
						{
							onSuccess: () => {
								onSuccess()
							},
							onSettled: () => {
								setShowConfirmation(false)
							},
						},
					)
				}}
				type={blobId.type}
			/>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					deleteAttachment.status === 'error' ? deleteAttachment.error : null
				}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							deleteAttachment.reset()
						}}
					/>
				)}
			</DecentDialog>
		</>
	)
}

function DeleteAttachmentConfirmationDialog({
	open,
	type,
	onCancel,
	onConfirm,
}: {
	open: boolean
	type: BlobId['type']
	onConfirm: () => void
	onCancel: () => void
}) {
	const { formatMessage: t } = useIntl()

	return (
		<Dialog open={open} fullWidth maxWidth="sm">
			<Stack direction="column">
				<Stack direction="column" sx={{ gap: 10, flex: 1, padding: 20 }}>
					<Stack direction="column" sx={{ alignItems: 'center', gap: 4 }}>
						<Icon name="material-error" color="error" size={72} />

						<Typography
							variant="h1"
							sx={{ fontWeight: 500, textAlign: 'center' }}
						>
							{t(m.deleteAttachmentDialogTitle, { type })}
						</Typography>
					</Stack>
				</Stack>

				<Box
					sx={{
						position: 'sticky',
						bottom: 0,
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'space-between',
						gap: 6,
						padding: 6,
					}}
				>
					<Button
						fullWidth
						variant="outlined"
						onClick={() => {
							onCancel()
						}}
						sx={{ maxWidth: 400 }}
					>
						{t(m.deleteAttachmentDialogCancel)}
					</Button>

					<Button
						fullWidth
						color="error"
						onClick={() => {
							onConfirm()
						}}
						startIcon={<Icon name="material-symbols-delete" />}
						sx={{ maxWidth: 400 }}
					>
						{t(m.deleteAttachmentDialogConfirm)}
					</Button>
				</Box>
			</Stack>
		</Dialog>
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

	const { data: attachmentUrl } = useAttachmentUrl({ projectId, blobId })

	const downloadUrl = useMutation({
		...downloadURLMutationOptions(),
		mutationKey: DOWNLOAD_MUTATION_KEY,
	})

	return (
		<>
			<Stack
				direction="column"
				sx={{ gap: 2, justifyContent: 'center', alignItems: 'center' }}
			>
				<IconButton
					aria-labelledby="download-button-label"
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

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={downloadUrl.status === 'error' ? downloadUrl.error : null}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							downloadUrl.reset()
						}}
					/>
				)}
			</DecentDialog>
		</>
	)
}

const m = defineMessages({
	photoNavTitle: {
		id: '$1.routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.photoNavTitle',
		defaultMessage: 'Photo Info',
		description: 'Title of the photo attachment page.',
	},
	audioNavTitle: {
		id: '$1.routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.audioNavTitle',
		defaultMessage: 'Audio Recording',
		description: 'Title of the audio attachment page.',
	},
	download: {
		id: '$1.routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.download',
		defaultMessage: 'Download',
		description: 'Label text for download button',
	},
	delete: {
		id: '$1.routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.delete',
		defaultMessage: 'Delete',
		description: 'Label text for delete button',
	},
	deleteAttachmentDialogTitle: {
		id: '$1.routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.deleteAttachmentDialogTitle',
		defaultMessage:
			'Delete {type, select, photo {Photo} audio {Audio Recording} other {Attachment}}?',
		description: 'Title text for delete attachment confirmation dialog',
	},
	deleteAttachmentDialogCancel: {
		id: '$1.routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.deleteAttachmentDialogCancel',
		defaultMessage: 'Cancel',
		description:
			'Text for cancel button in delete attachment confirmation dialog',
	},
	deleteAttachmentDialogConfirm: {
		id: '$1.routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.deleteAttachmentDialogConfirm',
		defaultMessage: 'Yes, Delete',
		description:
			'Text for confirm button in delete attachment confirmation dialog',
	},
	deleteSuccessPanelTitle: {
		id: '$1.routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.deleteSuccessPanelTitle',
		defaultMessage:
			'{type, select, photo {Photo} audio {Audio Recording} other {Attachment}} Deleted',
		description: 'Title text for the successful deletion panel.',
	},
	returnToObservation: {
		id: '$1.routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.returnToObservation',
		defaultMessage: 'Return to Observation',
		description: 'Button text for the successful deletion panel.',
	},
})
