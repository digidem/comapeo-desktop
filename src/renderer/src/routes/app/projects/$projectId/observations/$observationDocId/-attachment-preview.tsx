import { use, type ReactNode } from 'react'
import { useAttachmentUrl } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { SxProps } from '@mui/material/styles'

import { BLUE_GREY, DARK_GREY } from '../../../../../../colors'
import { Icon } from '../../../../../../components/icon'
import {
	ButtonBaseLink,
	IconButtonLink,
	type ButtonBaseLinkComponentProps,
} from '../../../../../../components/link'
import { SuspenseImage } from '../../../../../../components/suspense-image'
import { type Attachment } from '../../../../../../lib/comapeo'
import { imageSrcResource } from '../../../../../../lib/image'
import { audioInfoResource } from '../../../../../../lib/resources/audio'
import { getFormattedDuration } from '../../../../../../lib/time'

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

export function AttachmentPreview({
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
					// TODO: Open some kind of lightbox modal?
					onClick={() => {
						alert('Not implemented yet')
					}}
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
					// TODO: Open some kind of lightbox modal
					onClick={() => {
						alert('Not implemented yet')
					}}
				>
					<Stack
						direction="column"
						useFlexGap
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
						useFlexGap
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

export function AttachmentError({ onClick }: { onClick: () => void }) {
	return (
		<IconButton sx={BASE_ATTACHMENT_CONTAINER_STYLE} onClick={onClick}>
			<Icon name="material-error" color="error" size={30} />
		</IconButton>
	)
}

export function AttachmentPending() {
	return (
		<Box sx={BASE_ATTACHMENT_CONTAINER_STYLE}>
			<CircularProgress disableShrink size={30} />
		</Box>
	)
}

// Adapted from https://mui.com/material-ui/react-button/#complex-button
function ImageButtonLink({
	borderColor,
	children,
	height,
	...linkProps
}: Pick<ButtonBaseLinkComponentProps, 'to' | 'params' | 'onClick'> & {
	children: ReactNode
	height: number
	borderColor: string
}) {
	return (
		<ButtonBaseLink
			{...linkProps}
			focusRipple
			sx={{
				'&:hover': {
					'& .MuiImageBackdrop-root': {
						opacity: 0.15,
					},
				},
			}}
		>
			<Box
				height={height}
				position="relative"
				display="flex"
				overflow="hidden"
				borderRadius={2}
				border={`1px solid ${borderColor}`}
			>
				<Box
					component="span"
					className="MuiImageBackdrop-root"
					sx={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 0,
						bottom: 0,
						opacity: 0,
						backgroundColor: (theme) => theme.palette.common.black,
						transition: (theme) => theme.transitions.create('opacity'),
					}}
				/>
				{children}
			</Box>
		</ButtonBaseLink>
	)
}

function PhotoAttachmentImage({
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
			variant: 'preview',
			type: 'photo',
		},
	})

	const src = use(imageSrcResource(url))

	return (
		<SuspenseImage
			src={src}
			style={{
				objectFit: 'cover',
			}}
		/>
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
