import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import { Icon } from '../../../../../../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../../../../hooks/icon.ts'

export function DisconnectedIndicator() {
	const intl = useIntl()

	const iconSize = useIconSizeBasedOnTypography({
		variant: 'detailCopy',
		multiplier: 1,
	})

	return (
		<Stack direction="row" sx={{ gap: 1 }}>
			<Icon name="material-warning-rounded" color="warning" size={iconSize} />

			<Typography variant="detailCopy" color="warning">
				{intl.formatMessage(m.disconnected)}
			</Typography>
		</Stack>
	)
}

const m = defineMessages({
	disconnected: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.disconnected',
		defaultMessage: 'Disconnected',
		description: 'Text displayed when external device is disconnected.',
	},
})
