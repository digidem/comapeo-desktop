import { useOwnDeviceInfo } from '@comapeo/core-react'
import { Box } from '@mui/material'

import { COMAPEO_BLUE } from '../../../../colors'

export function SyncedIndicatorLine({
	createdByDeviceId,
}: {
	createdByDeviceId: string | undefined
}) {
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	return ownDeviceInfo.deviceId !== createdByDeviceId ? (
		<Box
			sx={{
				position: 'absolute',
				width: 8,
				left: 0,
				bottom: 0,
				top: 0,
				bgcolor: COMAPEO_BLUE,
			}}
		/>
	) : null
}
