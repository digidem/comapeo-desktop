import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl, type MessageTag } from 'react-intl'

import { TITLE_BAR_HEIGHT } from '../lib/constants.ts'
import { Blue, Bold, Orange } from './intl-rich-text.tsx'

const TITLE_BAR_COLOR = '#2348B2'

export function AppTitleBar({
	platform,
	testId,
}: {
	platform: NodeJS.Platform
	testId?: string
}) {
	const intl = useIntl()

	return (
		<Box
			data-testid={testId}
			sx={{
				// NOTE: macOS has the window controls on the left side by default.
				alignItems: 'center',
				appRegion: 'drag',
				bgcolor: TITLE_BAR_COLOR,
				display: 'flex',
				height: TITLE_BAR_HEIGHT,
				justifyContent: platform === 'darwin' ? 'flex-end' : undefined,
				paddingX: 6,
				position: 'relative',
				WebkitAppRegion: 'drag',
				zIndex: (theme) => theme.zIndex.tooltip + 1,
			}}
		>
			<Typography color="textInverted">
				{intl.formatMessage(m.appName, { b: Bold, orange: Orange, blue: Blue })}
			</Typography>
		</Box>
	)
}

const m = defineMessages<{
	readonly appName: {
		readonly b: MessageTag
		readonly blue: MessageTag
		readonly orange: MessageTag
	}
}>({
	appName: {
		id: '$1.components.app-title-bar.appName',
		defaultMessage: '<b><orange>Co</orange>Mapeo</b> <blue>Desktop</blue>',
		description: 'Name of the app displayed in the title bar.',
	},
})
