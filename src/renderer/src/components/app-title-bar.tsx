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
			data-testid={testId}
			sx={{
				height: TITLE_BAR_HEIGHT,
				display: 'flex',
				alignItems: 'center',
				justifyContent: platform === 'darwin' ? 'flex-end' : undefined,
				paddingX: 6,
				bgcolor: TITLE_BAR_COLOR,
				appRegion: 'drag',
				WebkitAppRegion: 'drag',
			}}
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
