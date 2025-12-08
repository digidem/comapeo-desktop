import { use } from 'react'
import { useAttachmentUrl } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { SxProps } from '@mui/material/styles'

import { BLUE_GREY, DARK_GREY } from '../../../../../../colors'
import { Icon } from '../../../../../../components/icon'
import { IconButtonLink } from '../../../../../../components/link'
import type {
	AudioAttachment,
	AudioAttachmentVariant,
	PhotoAttachment,
	PhotoAttachmentVariant,
} from '../../../../../../lib/comapeo.ts'
import { audioInfoResource } from '../../../../../../lib/resources/audio'
import { getFormattedDuration } from '../../../../../../lib/time'
import { ImageButtonLink } from './-components/image-button-link'
import { PhotoAttachmentImage } from './-components/photo-attachment-image'

const ATTACHMENT_CONTAINER_HEIGHT_PX = 128

const BASE_ATTACHMENT_CONTAINER_STYLE: SxProps = {
	display: 'flex',
	flexDirection: 'column',
	borderRadius: 2,
	border: `1px solid ${BLUE_GREY}`,
	justifyContent: 'center',
	alignItems: 'center',
	height: ATTACHMENT_CONTAINER_HEIGHT_PX,
	aspectRatio: 1,
}

export function ObservationPhotoAttachmentPreview({
	attachment,
	projectId,
	variant,
}: {
	attachment: PhotoAttachment
	projectId: string
	variant: PhotoAttachmentVariant
}) {
	return (
		<ImageButtonLink
			height={128}
			borderColor={BLUE_GREY}
			to="/app/projects/$projectId/observations/$observationDocId/attachments/$driveId/$type/$variant/$name"
			params={(prev) => ({
				...prev,
				driveId: attachment.driveDiscoveryId,
				type: 'photo' as const,
				variant,
				name: attachment.name,
			})}
		>
			<PhotoAttachmentImage
				attachmentDriveId={attachment.driveDiscoveryId}
				attachmentName={attachment.name}
				attachmentVariant={variant}
				projectId={projectId}
			/>
		</ImageButtonLink>
	)
}

export function ObservationAudioAttachmentPreview({
	attachment,
	projectId,
	variant,
}: {
	attachment: AudioAttachment
	projectId: string
	variant: AudioAttachmentVariant
}) {
	return (
		<IconButtonLink
			sx={BASE_ATTACHMENT_CONTAINER_STYLE}
			to="/app/projects/$projectId/observations/$observationDocId/attachments/$driveId/$type/$variant/$name"
			params={(prev) => ({
				...prev,
				driveId: attachment.driveDiscoveryId,
				type: 'audio' as const,
				variant,
				name: attachment.name,
			})}
		>
			<Stack
				direction="column"
				gap={2}
				justifyContent="center"
				alignItems="center"
			>
				<Icon name="material-volume-up" htmlColor={DARK_GREY} />

				<AudioDurationText
					projectId={projectId}
					attachmentDriveId={attachment.driveDiscoveryId}
					attachmentName={attachment.name}
					attachmentVariant={variant}
				/>
			</Stack>
		</IconButtonLink>
	)
}

// TODO: Needs more design direction
export function ObservationUnsupportedAttachmentPreview({
	attachmentName,
}: {
	attachmentName: string
}) {
	return (
		<IconButton
			sx={BASE_ATTACHMENT_CONTAINER_STYLE}
			// TODO: Open dialog with attachment info?
			onClick={() => {
				alert(attachmentName)
			}}
		>
			<Stack
				direction="column"
				gap={2}
				justifyContent="center"
				alignItems="center"
				overflow={'auto'}
			>
				<Icon name="material-attachment" htmlColor={DARK_GREY} />
			</Stack>
		</IconButton>
	)
}

export function ObservationAttachmentError() {
	return (
		<Box sx={BASE_ATTACHMENT_CONTAINER_STYLE}>
			<Icon name="material-error" color="error" size={30} />
		</Box>
	)
}

export function ObservationAttachmentPending() {
	return (
		<Box sx={BASE_ATTACHMENT_CONTAINER_STYLE}>
			<CircularProgress disableShrink size={30} />
		</Box>
	)
}

function AudioDurationText({
	attachmentDriveId,
	attachmentName,
	attachmentVariant,
	projectId,
}: {
	attachmentDriveId: string
	attachmentName: string
	attachmentVariant: AudioAttachmentVariant
	projectId: string
}) {
	const { data: url } = useAttachmentUrl({
		projectId,
		blobId: {
			driveId: attachmentDriveId,
			name: attachmentName,
			variant: attachmentVariant,
			type: 'audio',
		},
	})

	const audioInfo = use(audioInfoResource(url))

	return (
		<Typography fontWeight={500}>
			{getFormattedDuration(audioInfo.duration)}
		</Typography>
	)
}
