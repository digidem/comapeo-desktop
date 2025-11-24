import { Suspense, useState } from 'react'
import {
	useAttachmentUrl,
	useOwnDeviceInfo,
	useOwnRoleInProject,
	useSingleDocByDocId,
	useUpdateDocument,
} from '@comapeo/core-react'
import type { Observation } from '@comapeo/schema'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { PhotoAttachmentImage } from '../-components/photo-attachment-image'
import { BLUE_GREY, GREEN, LIGHT_GREY } from '../../../../../../../colors'
import { ErrorBoundary } from '../../../../../../../components/error-boundary'
import { ErrorDialog } from '../../../../../../../components/error-dialog'
import { Icon } from '../../../../../../../components/icon'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../../../../lib/queries/app-settings'
import { createGlobalMutationsKey } from '../../../../../../../lib/queries/global-mutations'
import { downloadURLMutationOptions } from '../../../../../../../lib/queries/system'

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
			throw redirect({
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
						{t(m.deleteSuccessPanelTitle, { type })}
					</Typography>
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
	const { formatMessage: t } = useIntl()

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
							to: '/app/projects/$projectId/observations/$observationDocId',
							params: { projectId, observationDocId },
							replace: true,
						})
					}}
				>
					<Icon name="material-arrow-back" size={30} />
				</IconButton>

				<Typography variant="h1" fontWeight={500}>
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
						<Stack direction="row" justifyContent="space-around" gap={6}>
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
				value: {
					...observation,
					attachments: updatedAttachments,
				},
			})
		},
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

			<ErrorDialog
				open={deleteAttachment.status === 'error'}
				errorMessage={deleteAttachment?.error?.toString()}
				onClose={() => {
					deleteAttachment.reset()
				}}
			/>
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
				<Stack direction="column" gap={10} flex={1} padding={20}>
					<Stack direction="column" alignItems="center" gap={4}>
						<Icon name="material-error" color="error" size={72} />

						<Typography variant="h1" fontWeight={500} textAlign="center">
							{t(m.deleteAttachmentDialogTitle, { type })}
						</Typography>
					</Stack>
				</Stack>

				<Box
					position="sticky"
					bottom={0}
					display="flex"
					flexDirection="row"
					justifyContent="space-between"
					gap={6}
					padding={6}
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
	delete: {
		id: 'routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.delete',
		defaultMessage: 'Delete',
		description: 'Label text for delete button',
	},
	deleteAttachmentDialogTitle: {
		id: 'routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.deleteAttachmentDialogTitle',
		defaultMessage:
			'Delete {type, select, photo {Photo} audio {Audio Recording} other {Attachment}}?',
		description: 'Title text for delete attachment confirmation dialog',
	},
	deleteAttachmentDialogCancel: {
		id: 'routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.deleteAttachmentDialogCancel',
		defaultMessage: 'Cancel',
		description:
			'Text for cancel button in delete attachment confirmation dialog',
	},
	deleteAttachmentDialogConfirm: {
		id: 'routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.deleteAttachmentDialogConfirm',
		defaultMessage: 'Yes, Delete',
		description:
			'Text for confirm button in delete attachment confirmation dialog',
	},
	deleteSuccessPanelTitle: {
		id: 'routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.deleteSuccessPanelTitle',
		defaultMessage:
			'{type, select, photo {Photo} audio {Audio Recording} other {Attachment}} Deleted',
		description: 'Title text for the successful deletion panel.',
	},
	returnToObservation: {
		id: 'routes.app.projects.$projectId.attachments.$driveId.$type.$variant.$name.returnToObservation',
		defaultMessage: 'Return to Observation',
		description: 'Button text for the successful deletion panel.',
	},
})
