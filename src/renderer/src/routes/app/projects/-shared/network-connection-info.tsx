import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSuspenseQuery } from '@tanstack/react-query'
import { defineMessages, useIntl } from 'react-intl'

import { LIGHT_COMAPEO_BLUE } from '#renderer/src/colors.ts'
import { Icon } from '#renderer/src/components/icon.tsx'
import { useIconSizeBasedOnTypography } from '#renderer/src/hooks/icon.ts'
import { useBrowserNetInfo } from '#renderer/src/hooks/network.ts'
import { getWifiConnectionsOptions } from '#renderer/src/lib/queries/system.ts'

export function NetworkConnectionInfo({
	waitingText,
}: {
	waitingText: string
}) {
	const { formatMessage: t } = useIntl()

	const { data: wifiConnection, isRefetching: isRefetchingWifiConnection } =
		useSuspenseQuery({
			...getWifiConnectionsOptions(),
			select: (connections) => {
				return connections[0]
			},
			refetchOnWindowFocus: false,
		})

	const netInfo = useBrowserNetInfo()

	const wifiIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 0.8,
	})

	return (
		<Stack
			direction="row"
			gap={3}
			alignItems="center"
			justifyContent="center"
			overflow="auto"
		>
			{isRefetchingWifiConnection ? (
				<Typography fontWeight={500}>{waitingText}</Typography>
			) : (
				<>
					<WifiIcon
						offline={!(netInfo.online || wifiConnection)}
						size={wifiIconSize}
					/>

					<Typography fontWeight={500}>
						{wifiConnection &&
						// NOTE: Issue with systeminformation module on macOS >=15.6 (https://github.com/digidem/comapeo-desktop/issues/378)
						wifiConnection.ssid !== '&lt;redacted&gt;'
							? `${wifiConnection.ssid}${
									netInfo.effectiveType
										? // TODO: Should the effectiveType be translatable?
											` - ${netInfo.effectiveType}`
										: undefined
								}`
							: t(m.wifiInfoUnavailable)}
					</Typography>
				</>
			)}
		</Stack>
	)
}

function WifiIcon({
	offline,
	size,
}: {
	offline?: boolean
	size?: string | number
}) {
	return (
		<Box
			display="flex"
			justifyContent="center"
			alignItems="center"
			borderRadius="50%"
			padding={1}
			bgcolor={LIGHT_COMAPEO_BLUE}
		>
			<Icon
				name={offline ? 'material-wifi-off' : 'material-wifi'}
				size={size}
			/>
		</Box>
	)
}

const m = defineMessages({
	wifiInfoUnavailable: {
		id: 'routes.app.projects.-shared.network-connection-info.wifiInfoUnavailable',
		defaultMessage: 'Wi-Fi info unavailable.',
		description: 'Text displayed when Wi-Fi info is unavailable.',
	},
})
