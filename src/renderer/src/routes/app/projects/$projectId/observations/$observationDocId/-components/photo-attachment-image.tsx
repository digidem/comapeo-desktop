import { use } from 'react'
import { useAttachmentUrl } from '@comapeo/core-react'

import {
	SuspenseImage,
	type SuspenseImageProps,
} from '../../../../../../../components/suspense-image'
import type { PhotoAttachmentVariant } from '../../../../../../../lib/comapeo.ts'
import { imageSrcResource } from '../../../../../../../lib/image'

export function PhotoAttachmentImage({
	attachmentDriveId,
	attachmentName,
	attachmentVariant,
	projectId,
	style,
}: {
	attachmentDriveId: string
	attachmentName: string
	attachmentVariant: PhotoAttachmentVariant
	projectId: string
	style?: SuspenseImageProps['style']
}) {
	const { data: url } = useAttachmentUrl({
		projectId,
		blobId: {
			driveId: attachmentDriveId,
			name: attachmentName,
			variant: attachmentVariant,
			type: 'photo',
		},
	})

	const src = use(imageSrcResource(url))

	return <SuspenseImage src={src} style={{ objectFit: 'cover', ...style }} />
}
