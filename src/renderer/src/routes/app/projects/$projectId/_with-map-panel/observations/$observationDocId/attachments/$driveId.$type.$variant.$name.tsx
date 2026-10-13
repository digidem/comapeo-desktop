import { Suspense, useId, useState } from 'react'
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
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { type SxProps, type Theme } from '@mui/material/styles'
import { captureMessage } from '@sentry/react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { MediaProvider } from 'media-chrome/react/media-store'
import { defineMessages, useIntl, type NoMessageValues } from 'react-intl'
import * as v from 'valibot'

import { DeleteConfirmationDialogContentLayout } from '../-components/delete-confirmation-dialog-content-layout.tsx'
import { DeleteSuccessPanelLayout } from '../-components/delete-success-panel-layout.tsx'
import { PhotoAttachmentImage } from '../-components/photo-attachment-image.tsx'
import { BLUE_05 } from '../../../../../../../../../../shared/colors.ts'
import { DecentDialog } from '../../../../../../../../components/decent-dialog.tsx'
import { ErrorBoundary } from '../../../../../../../../components/error-boundary.tsx'
import { ErrorDialogContent } from '../../../../../../../../components/error-dialog.tsx'
import { Icon } from '../../../../../../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../../../../hooks/icon.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../../../../../lib/comapeo.ts'
import { getLocaleStateQueryOptions } from '../../../../../../../../lib/queries/app-settings.ts'
import { createGlobalMutationsKey } from '../../../../../../../../lib/queries/global-mutations.ts'
import { downloadURLMutationOptions } from '../../../../../../../../lib/queries/system.ts'
import { AudioPlayback } from './-audio-playback.tsx'

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
	'/app/projects/$projectId/_with-map-panel/observations/$observationDocId/attachments/$driveId/$type/$variant/$name',
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

		const observation = await queryClient.query({
			staleTime: 'static',
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
			queryClient.query({
				staleTime: 'static',
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
				queryFn: async () => {
					return clientApi.getDeviceInfo()
				},
			}),
			queryClient.query({
				staleTime: 'static',
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
	const intl = useIntl()

	const router = useRouter()

	const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)

	const { projectId, observationDocId, ...blobId } = Route.useParams()

	return showDeleteSuccess ? (
		<DeleteSuccessPanelLayout
			action={
				<Button
					fullWidth
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
					sx={{ alignSelf: 'center' }}
					variant="text"
				>
					{intl.formatMessage(m.returnToObservation)}
				</Button>
			}
			title={intl.formatMessage(m.deleteSuccessPanelTitle, {
				type: blobId.type,
			})}
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

const BASE_SQUARE_ATTACHMENT_CONTAINER_STYLE: SxProps<Theme> = {
	alignItems: 'center',
	border: `1px solid ${BLUE_05}`,
	borderRadius: 4,
	display: 'flex',
	flexDirection: 'row',
	height: 'min(100%, 400px)',
	justifyContent: 'center',
	padding: 6,
	width: 'min(100%, 400px)',
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

	const backIconSize = useIconSizeBasedOnTypography({
		variant: 'pageTitle',
		multiplier: 1.25,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				direction="row"
				sx={{
					alignItems: 'center',
					borderBottom: `1px solid ${BLUE_05}`,
					gap: 4,
					padding: 4,
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
					<Icon name="material-arrow-back" size={backIconSize} />
				</IconButton>

				<Typography variant="pageTitle">
					{intl.formatMessage(
						blobId.type === 'photo' ? m.photoNavTitle : m.audioNavTitle,
					)}
				</Typography>
			</Stack>

			<Suspense
				fallback={
					<Box sx={{ display: 'grid', flex: 1, placeItems: 'center' }}>
						<CircularProgress disableShrink />
					</Box>
				}
			>
				<LoadedAttachmentSection
					blobId={blobId}
					observationDocId={observationDocId}
					onDeleteSuccess={onDeleteSuccess}
					projectId={projectId}
				/>
			</Suspense>
		</Stack>
	)
}

function LoadedAttachmentSection({
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

	const errorIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

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
			<Box
				sx={{
					display: 'grid',
					flex: 1,
					overflow: 'auto',
					padding: 6,
					placeItems: 'center',
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
							<Icon name="material-error" size={errorIconSize} color="error" />
						</Box>
					)}
				>
					<Suspense
						fallback={
							<Box sx={BASE_SQUARE_ATTACHMENT_CONTAINER_STYLE}>
								<CircularProgress disableShrink />
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
									border: `1px solid ${BLUE_05}`,
									borderRadius: 4,
									margin: 'auto',
									width: 'min(100%, 400px)',
								}}
							/>
						) : (
							<AudioRecordingCard
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
				<Stack
					direction="row"
					sx={{
						borderTop: `1px solid ${BLUE_05}`,
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
			</ErrorBoundary>
		</Stack>
	)
}

function AudioRecordingCard({
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
				<MediaProvider>
					<AudioPlayback lang={lang} src={attachmentUrl} />
				</MediaProvider>

				{createdAt ? (
					<Typography sx={{ textAlign: 'center', textWrap: 'balance' }}>
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

	const intl = useIntl()

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

	const labelId = useId()

	return (
		<>
			<Stack
				direction="column"
				sx={{ alignItems: 'center', gap: 2, justifyContent: 'center' }}
			>
				<IconButton
					aria-labelledby={labelId}
					sx={{ border: `1px solid ${BLUE_05}` }}
					onClick={() => {
						setShowConfirmation(true)
					}}
				>
					<Icon name="material-symbols-delete" />
				</IconButton>

				<Typography id={labelId}>{intl.formatMessage(m.delete)}</Typography>
			</Stack>

			<DecentDialog fullWidth maxWidth="sm" value={showConfirmation || null}>
				{() => {
					const actionIsPending = deleteAttachment.status === 'pending'

					return (
						<DeleteConfirmationDialogContentLayout
							actions={
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'row',
										gap: 4,
										justifyContent: 'center',
										padding: 6,
									}}
								>
									<Button
										fullWidth
										onClick={
											actionIsPending
												? undefined
												: () => {
														setShowConfirmation(false)
													}
										}
										variant="outlined"
									>
										{intl.formatMessage(m.deleteAttachmentDialogCancel)}
									</Button>

									<Button
										color="error"
										fullWidth
										loading={actionIsPending}
										loadingPosition="start"
										onClick={
											actionIsPending
												? undefined
												: () => {
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
													}
										}

										startIcon={<Icon name="material-symbols-delete" />}
									>
										{intl.formatMessage(m.deleteAttachmentDialogConfirm)}
									</Button>
								</Box>
							}
							title={intl.formatMessage(m.deleteAttachmentDialogTitle, {
								type: blobId.type,
							})}
						/>
					)
				}}
			</DecentDialog>

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

const DOWNLOAD_MUTATION_KEY = createGlobalMutationsKey(['download', 'url'])

function DownloadButton({
	projectId,
	blobId,
}: {
	projectId: string
	blobId: BlobId
}) {
	const intl = useIntl()

	const { data: attachmentUrl } = useAttachmentUrl({ projectId, blobId })

	const downloadUrl = useMutation({
		...downloadURLMutationOptions(),
		mutationKey: DOWNLOAD_MUTATION_KEY,
	})

	const labelId = useId()

	return (
		<>
			<Stack
				direction="column"
				sx={{ alignItems: 'center', gap: 2, justifyContent: 'center' }}
			>
				<IconButton
					aria-labelledby={labelId}
					sx={{ border: `1px solid ${BLUE_05}` }}
					onClick={() => {
						if (downloadUrl.status === 'pending') {
							return
						}

						downloadUrl.mutate({ url: attachmentUrl, saveAs: true })
					}}
				>
					<Icon name="material-file-download" />
				</IconButton>

				<Typography id={labelId}>{intl.formatMessage(m.download)}</Typography>
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

const m = defineMessages<{
	readonly photoNavTitle: NoMessageValues
	readonly audioNavTitle: NoMessageValues
	readonly download: NoMessageValues
	readonly delete: NoMessageValues
	readonly deleteAttachmentDialogTitle: { readonly type: string }
	readonly deleteAttachmentDialogCancel: NoMessageValues
	readonly deleteAttachmentDialogConfirm: NoMessageValues
	readonly deleteSuccessPanelTitle: { readonly type: string }
	readonly returnToObservation: NoMessageValues
}>({
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
