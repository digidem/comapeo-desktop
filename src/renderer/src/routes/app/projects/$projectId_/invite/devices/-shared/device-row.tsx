import { useMemo } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { defineMessages, useIntl } from 'react-intl'

import { DeviceIcon } from '../../../../-shared/device-icon'
import { ORANGE } from '../../../../../../../colors'
import { Icon } from '../../../../../../../components/icon'
import type { DeviceType } from '../../../../../../../lib/comapeo'

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
	const { formatMessage: t } = useIntl()

	const theme = useTheme()

	const deviceIconSize = useMemo(() => {
		return `calc(${theme.typography.body1.fontSize} * ${theme.typography.body1.lineHeight} * 1.5)`
	}, [theme.typography.body1.fontSize, theme.typography.body1.lineHeight])

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

				{disconnected ? (
					<Stack direction="row" gap={1} alignItems="center">
						<Icon
							name="material-warning-rounded"
							htmlColor={ORANGE}
							size={theme.typography.body2.fontSize}
						/>
						<Typography variant="body2" color="warning">
							{t(m.disconnected)}
						</Typography>
					</Stack>
				) : null}
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	disconnected: {
		id: 'routes.app.projects.$projectId_.invite.devices.-shared.device-row.disconnected',
		defaultMessage: 'Disconnected',
		description: 'Text displayed when external device is disconnected.',
	},
})
