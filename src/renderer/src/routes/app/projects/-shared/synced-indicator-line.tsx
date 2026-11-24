import { useOwnDeviceInfo } from '@comapeo/core-react'
import Box from '@mui/material/Box'

import { BLUE_03 } from '../../../../../../shared/colors.ts'

export function SyncedIndicatorLine({
	createdByDeviceId,
}: {
	createdByDeviceId: string | undefined
}) {
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	return ownDeviceInfo.deviceId !== createdByDeviceId ? (
		<Box
			sx={{
				background: BLUE_03,
				bottom: 0,
				left: 0,
				position: 'absolute',
				top: 0,
				width: 8,
			}}
		/>
	) : null
}
