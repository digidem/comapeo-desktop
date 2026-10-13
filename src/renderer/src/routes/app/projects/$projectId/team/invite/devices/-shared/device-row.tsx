import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { DeviceIcon } from '../../../../../-shared/device-icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../../../../hooks/icon.ts'
import type { DeviceType } from '../../../../../../../../lib/comapeo.ts'
import { DisconnectedIndicator } from './disconnected-indicator.tsx'

export function DeviceRow({
	deviceId,
	deviceType,
	disconnected,
	name,
}: {
	deviceId: string
	deviceType: DeviceType | undefined
	disconnected?: boolean
	name: string | undefined
}) {
	const deviceIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'cardHeader',
		multiplier: 1.5,
	})

	return (
		<Stack
			direction="row"
			sx={{
				alignItems: 'center',
				flex: 1,
				gap: 4,
				overflow: 'auto',
				padding: 6,
			}}
		>
			<DeviceIcon deviceType={deviceType} size={deviceIconSize} />

			<Stack direction="column" sx={{ flex: 1, gap: 1, overflow: 'auto' }}>
				<Typography
					variant="cardHeader"
					sx={{
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{name}
				</Typography>

				<Typography
					sx={{
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{deviceId.slice(0, 12)}
				</Typography>

				{disconnected ? <DisconnectedIndicator /> : null}
			</Stack>
		</Stack>
	)
}
