import { use } from 'react'
import { useAttachmentUrl } from '@comapeo/core-react'

import { SuspenseImage } from '#renderer/src/components/suspense-image.tsx'
import { imageSrcResource } from '#renderer/src/lib/image.ts'

export function PhotoAttachmentImage({
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
			type: 'photo',
		},
	})

	const src = use(imageSrcResource(url))

	return <SuspenseImage src={src} style={{ objectFit: 'cover' }} />
}
