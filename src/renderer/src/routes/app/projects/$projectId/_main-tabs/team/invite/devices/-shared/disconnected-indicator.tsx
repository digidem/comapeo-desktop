import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import { ORANGE } from '../../../../../../../../../colors.ts'
import { Icon } from '../../../../../../../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../../../../../hooks/icon.ts'

export function DisconnectedIndicator() {
	const { formatMessage: t } = useIntl()

	const iconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body2',
		multiplier: 0.6,
	})

	return (
		<Stack direction="row" sx={{ gap: 1 }}>
			<Icon
				name="material-warning-rounded"
				htmlColor={ORANGE}
				size={iconSize}
			/>
			<Typography variant="body2" color="warning">
				{t(m.disconnected)}
			</Typography>
		</Stack>
	)
}

const m = defineMessages({
	disconnected: {
		id: '$1.routes.app.projects.$projectId.team.invite.devices.-shared.disconnected-indicator.disconnected',
		defaultMessage: 'Disconnected',
		description: 'Text displayed when external device is disconnected.',
	},
})
