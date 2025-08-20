import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

const TITLE_BAR_COLOR = '#2348B2'

// NOTE: This is provided by Electron when using the `titleBarOverlay` option for creating a BrowserWindow
// - https://www.electronjs.org/docs/latest/api/structures/base-window-options
// - https://github.com/WICG/window-controls-overlay/blob/main/explainer.md#css-environment-variables
export const TITLE_BAR_HEIGHT = `env(titlebar-area-height)`

export function AppTitleBar({ platform }: { platform: NodeJS.Platform }) {
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
