import { Suspense, type PropsWithChildren } from 'react'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { darken, lighten } from '@mui/material/styles'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DARK_COMAPEO_BLUE, LIGHT_GREY, WHITE } from '../../colors.ts'
import { Icon } from '../../components/icon.tsx'
import { IconButtonLink, type ButtonLinkProps } from '../../components/link.tsx'
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
					<NavIconTabLink
						to="/app"
						activeOptions={{ exact: true, includeSearch: false }}
						aria-label={t(m.homeTabAccessibleLabel)}
					>
						<Icon name="material-symbols-home" size={24} />
					</NavIconTabLink>

					<Divider
						orientation="vertical"
						sx={{ borderColor: DARK_COMAPEO_BLUE }}
					/>

					<NavIconTabLink
						to="/app/settings"
						aria-label={t(m.appSettingsTabAccessibleLabel)}
					>
						<Icon name="material-settings" size={24} />
					</NavIconTabLink>

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

function NavIconTabLink({
	children,
	...buttonLinkProps
}: PropsWithChildren<
	Omit<ButtonLinkProps, 'activeProps' | 'color' | 'disableTouchRipple' | 'sx'>
>) {
	return (
		<IconButtonLink
			{...buttonLinkProps}
			color="inherit"
			disableTouchRipple
			inactiveProps={{
				sx: {
					aspectRatio: 1,
					borderRadius: 0,
					color: LIGHT_GREY,
					'&:hover, &:focus-visible': {
						backgroundColor: lighten(DARK_COMAPEO_BLUE, 0.1),
					},
				},
			}}
			activeProps={{
				sx: {
					aspectRatio: 1,
					borderRadius: 0,
					backgroundColor: DARK_COMAPEO_BLUE,
					color: WHITE,
					'&:hover, &:focus-visible': {
						backgroundColor: lighten(DARK_COMAPEO_BLUE, 0.1),
					},
				},
			}}
		>
			{children}
		</IconButtonLink>
	)
}

const m = defineMessages({
	homeTabAccessibleLabel: {
		id: 'routes.app.route.homeTabAccessibleLabel',
		defaultMessage: 'Go to home page.',
		description: 'Accessible label for home tab link in navigation.',
	},
	appSettingsTabAccessibleLabel: {
		id: 'routes.app.route.appSettingsTabAccessibleLabel',
		defaultMessage: 'Go to app settings.',
		description: 'Accessible label for app settings tab link in navigation.',
	},
})
