import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useIconSizeBasedOnTypography } from '#renderer/src/hooks/icon.ts'
import type { DeviceType } from '#renderer/src/lib/comapeo.ts'
import { DeviceIcon } from '#renderer/src/routes/app/projects/-shared/device-icon.tsx'

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
		typographyVariant: 'body1',
		multiplier: 1.5,
	})

	return (
		<Stack
			direction="row"
			flex={1}
			gap={4}
			overflow="auto"
			alignItems="center"
			padding={5}
		>
			<DeviceIcon deviceType={deviceType} size={deviceIconSize} />

			<Stack direction="column" flex={1} overflow="auto">
				<Typography
					fontWeight={500}
					textOverflow="ellipsis"
					whiteSpace="nowrap"
					overflow="hidden"
				>
					{name}
				</Typography>

				<Typography
					color="textSecondary"
					textOverflow="ellipsis"
					whiteSpace="nowrap"
					overflow="hidden"
				>
					{deviceId.slice(0, 12)}
				</Typography>

				{disconnected ? <DisconnectedIndicator /> : null}
			</Stack>
		</Stack>
	)
}
