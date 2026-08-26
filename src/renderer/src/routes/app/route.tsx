import { Suspense } from 'react'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { darken, lighten } from '@mui/material/styles'
import { captureException } from '@sentry/react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DARK_COMAPEO_BLUE, LIGHT_GREY, WHITE } from '../../colors.ts'
import { Icon } from '../../components/icon.tsx'
import {
	IconButtonLink,
	type IconButtonLinkProps,
} from '../../components/link.tsx'
import { useActiveProjectId } from '../../contexts/active-project-id-store-context.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../lib/comapeo.ts'
import { getOnboardedAtQueryOptions } from '../../lib/queries/user.ts'
import { ProjectInviteDialog } from './-project-invite-dialog.tsx'
import { ProjectTabButton } from './-project-tab-button.tsx'

export const Route = createFileRoute('/app')({
	beforeLoad: async ({ context }) => {
		const { queryClient, clientApi } = context

		const ownDeviceInfo = await queryClient.query({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
			queryFn: async () => {
				return clientApi.getDeviceInfo()
			},
		})

		// NOTE: Implicit check that the user hasn't completed the onboarding yet.
		if (!ownDeviceInfo.name) {
			throw Route.redirect({ to: '/welcome', replace: true })
		}
	},
	loader: async ({ context, preload }) => {
		const { queryClient } = context

		// NOTE: Backfill step for users who onboarded before we started persisting an `onboardedAt` timestamp.
		// We assume that if they're able to navigate to any "app" page, then they have passed the checks for being "onboarded".
		if (!preload) {
			const onboardedAtQueryOptions = getOnboardedAtQueryOptions()

			const onboardedAt = await queryClient.ensureQueryData(
				onboardedAtQueryOptions,
			)

			if (onboardedAt === null) {
				const updatedOnboardedAt = Date.now()

				try {
					await window.runtime.setOnboardedAt(updatedOnboardedAt)

					// NOTE: We synchronously update to ensure the updated timestamp is used on initial render.
					queryClient.setQueryData(
						onboardedAtQueryOptions.queryKey,
						updatedOnboardedAt,
					)
				} catch (err) {
					captureException(err)
				}
			}
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const activeProjectId = useActiveProjectId()

	return (
		<Box sx={{ bgcolor: WHITE, height: '100%' }}>
			<Box
				sx={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}
			>
				<Stack
					component="nav"
					direction="row"
					aria-label={t(m.appNavigationAccesibleLabel)}
					sx={{
						overflow: 'auto',
						bgcolor: darken(DARK_COMAPEO_BLUE, 0.5),
						height: 48,
					}}
				>
					<Tooltip
						title={t(m.homeTabLabel)}
						disableFocusListener
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

					<Stack direction="row" sx={{ padding: 2, gap: 2, overflowX: 'auto' }}>
						{activeProjectId ? (
							<ProjectTabButton projectId={activeProjectId} />
						) : null}
					</Stack>
				</Stack>

				<Box sx={{ display: 'flex', overflow: 'auto' }}>
					<Outlet />

					<Suspense>
						<ProjectInviteDialog />
					</Suspense>
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
	appNavigationAccesibleLabel: {
		id: 'routes.app.projects.$projectId.route.appNavigationAccesibleLabel',
		defaultMessage: 'App navigation',
		description: 'Accessible label for app-wide navigation bar.',
	},
	homeTabLabel: {
		id: '$1.routes.app.route.homeTabTitle',
		defaultMessage: 'Home',
		description: 'Label for home tab link in navigation.',
	},
	appSettingsTabLabel: {
		id: '$1.routes.app.route.appSettingsTabLabel',
		defaultMessage: 'Settings',
		description: 'Label for app settings tab link in navigation.',
	},
})
