import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import { TITLE_BAR_HEIGHT } from '../lib/constants.ts'

const TITLE_BAR_COLOR = '#2348B2'

export function AppTitleBar({
	platform,
	testId,
}: {
	platform: NodeJS.Platform
	testId?: string
}) {
	const { formatMessage: t } = useIntl()

	return (
		<Box
			height={TITLE_BAR_HEIGHT}
			display="flex"
			alignItems="center"
			// NOTE: macOS has the window controls on the left side by default.
			justifyContent={platform === 'darwin' ? 'flex-end' : undefined}
			paddingX={6}
			bgcolor={TITLE_BAR_COLOR}
			sx={{ appRegion: 'drag', WebkitAppRegion: 'drag' }}
			data-testid={testId}
		>
			<Typography color="textInverted">{t(m.appName)}</Typography>
		</Box>
	)
}

const m = defineMessages({
	appName: {
		id: 'components.app-title-bar.appName',
		defaultMessage: '<b><orange>Co</orange>Mapeo</b> <blue>Desktop</blue>',
		description: 'Name of the app displayed in the title bar.',
	},
})
