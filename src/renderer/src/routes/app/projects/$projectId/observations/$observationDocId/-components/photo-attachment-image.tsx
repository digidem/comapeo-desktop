import { use } from 'react'
import { useAttachmentUrl } from '@comapeo/core-react'

import { SuspenseImage } from '../../../../../../../components/suspense-image'
import { imageSrcResource } from '../../../../../../../lib/image'

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
