import { use } from 'react'
import { useAttachmentUrl } from '@comapeo/core-react'
import type { Attachment } from '@comapeo/core/dist/types'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { SxProps } from '@mui/material/styles'

import { BLUE_GREY, DARK_GREY } from '#renderer/src/colors.ts'
import { Icon } from '#renderer/src/components/icon.tsx'
import { IconButtonLink } from '#renderer/src/components/link.tsx'
import { audioInfoResource } from '#renderer/src/lib/resources/audio.ts'
import { getFormattedDuration } from '#renderer/src/lib/time.ts'

import { ImageButtonLink } from './-components/image-button-link.tsx'
import { PhotoAttachmentImage } from './-components/photo-attachment-image.tsx'

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

export function ObservationAttachmentPreview({
	attachment,
	projectId,
}: {
	attachment: Attachment
	projectId: string
}) {
	switch (attachment.type) {
		case 'photo': {
			return (
				<ImageButtonLink
					height={128}
					borderColor={BLUE_GREY}
					to="/app/projects/$projectId/observations/$observationDocId/attachments/$driveId/$type/$variant/$name"
					params={(prev) => ({
						...prev,
						driveId: attachment.driveDiscoveryId,
						type: 'photo' as const,
						variant: 'original' as const,
						name: attachment.name,
					})}
				>
					<PhotoAttachmentImage
						attachmentDriveId={attachment.driveDiscoveryId}
						attachmentName={attachment.name}
						projectId={projectId}
					/>
				</ImageButtonLink>
			)
		}
		case 'audio': {
			return (
				<IconButtonLink
					sx={BASE_ATTACHMENT_CONTAINER_STYLE}
					to="/app/projects/$projectId/observations/$observationDocId/attachments/$driveId/$type/$variant/$name"
					params={(prev) => ({
						...prev,
						driveId: attachment.driveDiscoveryId,
						type: 'audio' as const,
						variant: 'original' as const,
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
						/>
					</Stack>
				</IconButtonLink>
			)
		}
		default: {
			// TODO: Needs more design direction
			return (
				<IconButton
					sx={BASE_ATTACHMENT_CONTAINER_STYLE}
					// TODO: Open dialog with attachment info?
					onClick={() => {
						alert(attachment.name)
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
	}
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
	projectId,
}: {
	attachmentDriveId: string
	attachmentName: string
	projectId: string
}) {
	const { data: url } = useAttachmentUrl({
		projectId,
		blobId: {
			driveId: attachmentDriveId,
			name: attachmentName,
			variant: 'original',
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
