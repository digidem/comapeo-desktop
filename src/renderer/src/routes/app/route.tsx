import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { darken, lighten } from '@mui/material/styles'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DARK_COMAPEO_BLUE, LIGHT_GREY, WHITE } from '../../colors.ts'
import { Icon } from '../../components/icon.tsx'
import {
	IconButtonLink,
	type IconButtonLinkProps,
} from '../../components/link.tsx'
import { useActiveProjectId } from '../../contexts/active-project-id-store-context.ts'
import { ProjectTabButton } from './-project-tab-button.tsx'

export const Route = createFileRoute('/app')({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const activeProjectId = useActiveProjectId()

	return (
		<Box bgcolor={WHITE} height="100%">
			<Box display="grid" gridTemplateRows="auto 1fr" height="100%">
				<Stack
					component="nav"
					overflow="auto"
					direction="row"
					bgcolor={darken(DARK_COMAPEO_BLUE, 0.5)}
					height={48}
				>
					<Tooltip
						title={t(m.homeTabLabel)}
						disableFocusListener
						describeChild
						placement="bottom"
					>
						<IconButtonLink
							to="/app"
							activeOptions={{ exact: true, includeSearch: false }}
							inactiveProps={BASE_INACTIVE_LINK_PROPS}
							activeProps={BASE_ACTIVE_LINK_PROPS}
						>
							<Icon name="material-symbols-home" size={24} />
						</IconButtonLink>
					</Tooltip>

					<Divider
						orientation="vertical"
						sx={{ borderColor: TAB_DIVIDER_COLOR }}
					/>

					<Tooltip
						title={t(m.appSettingsTabLabel)}
						disableFocusListener
						describeChild
						placement="bottom"
					>
						<IconButtonLink
							to="/app/settings"
							inactiveProps={BASE_INACTIVE_LINK_PROPS}
							activeProps={BASE_ACTIVE_LINK_PROPS}
						>
							<Icon name="material-settings" size={24} />
						</IconButtonLink>
					</Tooltip>

					<Divider
						orientation="vertical"
						sx={{ borderColor: TAB_DIVIDER_COLOR }}
					/>

					<Stack direction="row" padding={2} gap={2} sx={{ overflowX: 'auto' }}>
						{activeProjectId ? (
							<ProjectTabButton projectId={activeProjectId} />
						) : null}
					</Stack>
				</Stack>

				<Box component="main" display="flex" overflow="auto">
					<Outlet />
				</Box>
			</Box>
		</Box>
	)
}

const TAB_DIVIDER_COLOR = lighten(DARK_COMAPEO_BLUE, 0.1)

const BASE_INACTIVE_LINK_PROPS = {
	sx: {
		aspectRatio: 1,
		borderRadius: 0,
		color: LIGHT_GREY,
		'&:hover, &:focus-visible': {
			backgroundColor: lighten(DARK_COMAPEO_BLUE, 0.1),
		},
	},
} satisfies IconButtonLinkProps['inactiveProps']

const BASE_ACTIVE_LINK_PROPS = {
	sx: {
		aspectRatio: 1,
		borderRadius: 0,
		backgroundColor: DARK_COMAPEO_BLUE,
		color: WHITE,
		'&:hover, &:focus-visible': {
			backgroundColor: lighten(DARK_COMAPEO_BLUE, 0.1),
		},
	},
} satisfies IconButtonLinkProps['activeProps']

const m = defineMessages({
	homeTabLabel: {
		id: 'routes.app.route.homeTabTitle',
		defaultMessage: 'Home',
		description: 'Label for home tab link in navigation.',
	},
	appSettingsTabLabel: {
		id: 'routes.app.route.appSettingsTabLabel',
		defaultMessage: 'Settings',
		description: 'Label for app settings tab link in navigation.',
	},
})
