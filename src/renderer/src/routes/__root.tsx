import type { MapeoClientApi } from '@comapeo/ipc/client.js'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import type { LocaleState } from '../../../shared/intl'

export interface RootRouterContext {
	activeProjectId: string | null
	clientApi: MapeoClientApi
	localeState: LocaleState
	queryClient: QueryClient
}

const { platform } = window.runtime.getAppInfo()

const TITLE_BAR_COLOR = '#2348B2'
// NOTE: This is provided by Electron when using the `titleBarOverlay` option for creating a BrowserWindow
// - https://www.electronjs.org/docs/latest/api/structures/base-window-options
// - https://github.com/WICG/window-controls-overlay/blob/main/explainer.md#css-environment-variables
const TITLE_BAR_HEIGHT = `env(titlebar-area-height)`
const MAIN_CONTENT_HEIGHT = `calc(100% - ${TITLE_BAR_HEIGHT})`

export const Route = createRootRouteWithContext<RootRouterContext>()({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<Box height="100dvh">
			<TitleBar />

			<Box height={MAIN_CONTENT_HEIGHT}>
				<Outlet />
			</Box>
		</Box>
	)
}

function TitleBar() {
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
			sx={{ appRegion: 'drag', '-webkit-app-region': 'drag' }}
		>
			<Typography color="textInverted">{t(m.appName)}</Typography>
		</Box>
	)
}

const m = defineMessages({
	appName: {
		id: 'routes.__root.appName',
		defaultMessage: '<b><orange>Co</orange>Mapeo</b> <blue>Desktop</blue>',
		description: 'Name of the app displayed in the title bar.',
	},
})
