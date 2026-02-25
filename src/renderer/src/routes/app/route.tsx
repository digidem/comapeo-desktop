import { Suspense, type ComponentProps } from 'react'
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
					<Tooltip {...BASE_NAV_TAB_TOOLTIP_PROPS} title={t(m.homeTabLabel)}>
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
						sx={{ borderColor: DARK_COMAPEO_BLUE }}
					/>

					<Tooltip
						{...BASE_NAV_TAB_TOOLTIP_PROPS}
						title={t(m.appSettingsTabLabel)}
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
						sx={{ borderColor: DARK_COMAPEO_BLUE }}
					/>

					<Stack direction="row" padding={2} gap={2} sx={{ overflowX: 'auto' }}>
						{activeProjectId ? (
							<Suspense>
								<ProjectTabButton projectId={activeProjectId} />
							</Suspense>
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

const BASE_NAV_TAB_TOOLTIP_PROPS = {
	disableFocusListener: true,
	describeChild: true,
	placement: 'bottom',
	enterDelay: 0,
	leaveDelay: 0,
	slotProps: {
		popper: {
			modifiers: [{ name: 'offset', options: { offset: [0, -12] } }],
		},
		tooltip: {
			sx: (theme) => ({
				backgroundColor: theme.palette.common.white,
				color: theme.palette.text.primary,
				boxShadow: theme.shadows[5],
			}),
		},
	},
} satisfies Partial<ComponentProps<typeof Tooltip>>

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
