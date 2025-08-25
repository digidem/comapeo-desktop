import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { defineMessages, useIntl } from 'react-intl'

import { ORANGE } from '../../../../../../../colors'
import { Icon } from '../../../../../../../components/icon'

export function DisconnectedIndicator() {
	const { formatMessage: t } = useIntl()
	const theme = useTheme()

	return (
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
	)
}

const m = defineMessages({
	disconnected: {
		id: 'routes.app.projects.$projectId_.invite.devices.-shared.disconnected-indicator.disconnected',
		defaultMessage: 'Disconnected',
		description: 'Text displayed when external device is disconnected.',
	},
})
