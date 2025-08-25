import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import { ORANGE } from '../../../../../../../colors'
import { Icon } from '../../../../../../../components/icon'
import { useIconSizeBasedOnTypography } from '../../../../../../../hooks/icon'

export function DisconnectedIndicator() {
	const { formatMessage: t } = useIntl()

	const iconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body2',
		multiplier: 0.6,
	})

	return (
		<Stack direction="row" gap={1}>
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
		id: 'routes.app.projects.$projectId_.invite.devices.-shared.disconnected-indicator.disconnected',
		defaultMessage: 'Disconnected',
		description: 'Text displayed when external device is disconnected.',
	},
})
