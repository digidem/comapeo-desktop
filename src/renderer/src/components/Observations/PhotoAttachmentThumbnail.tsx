import { useState } from 'react'
import { useAttachmentUrl } from '@comapeo/core-react'
import type { Observation } from '@comapeo/schema'
import { CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'

const ImageContainer = styled('img')<{
	widthPx: number
	heightPx: number
}>(({ widthPx, heightPx }) => ({
	width: widthPx,
	height: heightPx,
	borderRadius: 6,
	objectFit: 'cover',
	backgroundColor: '#ccc',
}))

type Props = {
	projectId: string
	attachment: Observation['attachments'][number]
	width: number
	height: number
}

function toBlobId(attachment: Observation['attachments'][number]) {
	return {
		driveId: attachment.driveDiscoveryId,
		name: attachment.name,
		type: 'photo' as const,
		variant: 'thumbnail' as const,
	}
}

export function PhotoAttachmentThumbnail({
	projectId,
	attachment,
	width,
	height,
}: Props) {
	const blobId = toBlobId(attachment)
	const {
		data: url,
		error,
		isRefetching,
	} = useAttachmentUrl({
		projectId,
		blobId,
	})

	const [imgError, setImgError] = useState(false)
	const isError = error !== undefined || imgError || !url

	if (isRefetching) {
		return (
			<div
				style={{
					width,
					height,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<CircularProgress size={24} />
			</div>
		)
	}
	if (isError) {
		return (
			<div
				style={{
					width,
					height,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					border: '1px solid #eee',
					borderRadius: 6,
					backgroundColor: '#f0f0f0',
				}}
			>
				<span style={{ fontSize: 12, color: '#999' }}>No photo</span>
			</div>
		)
	}

	return (
		<ImageContainer
			widthPx={width}
			heightPx={height}
			src={url}
			alt="Observation Photo"
			onError={() => setImgError(true)}
		/>
	)
}
