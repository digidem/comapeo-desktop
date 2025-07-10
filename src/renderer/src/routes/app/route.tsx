import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import {
	Outlet,
	createFileRoute,
	redirect,
	type LinkOptions,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, COMAPEO_BLUE, DARK_GREY, WHITE } from '../../colors'
import { ButtonLink, IconButtonLink } from '../../components/button-link'
import { Icon } from '../../components/icon'

export const Route = createFileRoute('/app')({
	beforeLoad: ({ context, matches }) => {
		if (!context.activeProjectId) {
			throw new Error('Router context is missing `activeProjectId')
		}

		// Redirect to project-specific "initial" page if the current route is the just /app
		if (matches.at(-1)!.fullPath === '/app') {
			throw redirect({
				to: '/app/projects/$projectId',
				params: { projectId: context.activeProjectId },
				replace: true,
			})
		}

		return {
			activeProjectId: context.activeProjectId,
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const activeProjectId = Route.useRouteContext({
		select: ({ activeProjectId }) => activeProjectId,
	})

	return (
		<Box bgcolor={WHITE} height="100vh">
			<Box display="grid" gridTemplateColumns="min-content 1fr" height="100%">
				<Box
					component="nav"
					display="flex"
					borderRight={`2px solid ${BLUE_GREY}`}
					overflow="auto"
				>
					<List
						dense
						disablePadding
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
							flex: 0,
							padding: 4,
							gap: 5,
							textAlign: 'center',
							alignItems: 'center',
						}}
					>
						<ListItem {...SHARED_NAV_ITEM_PROPS.listItem}>
							<IconButtonLink
								{...SHARED_NAV_ITEM_PROPS.link}
								to="/app/projects/$projectId"
								params={{ projectId: activeProjectId }}
								activeProps={{
									...SHARED_NAV_ITEM_PROPS.link.activeProps,
									sx: {
										...SHARED_NAV_ITEM_PROPS.link.activeProps.sx,
										border: `2px solid currentColor`,
									},
								}}
								sx={{
									...SHARED_NAV_ITEM_PROPS.link.sx,
									border: `2px solid currentColor`,
								}}
							>
								<Icon name="comapeo-cards" size={30} />
							</IconButtonLink>
						</ListItem>

						<Stack direction="column" useFlexGap gap={5}>
							<LabeledNavItem
								// @ts-expect-error Not implemented yet
								to="/app/projects/$projectId/exchange"
								label={t(m.exchangeTabLabel)}
								icon={<Icon name="material-offline-bolt" size={30} />}
							/>

							<LabeledNavItem
								to="/app/settings"
								label={t(m.appSettingsTabLabel)}
								icon={<Icon name="material-settings" size={30} />}
							/>

							<LabeledNavItem
								to="/app/data-and-privacy"
								label={t(m.dataAndPrivacyTabLabel)}
								icon={
									<Icon name="material-symbols-encrypted-weight400" size={30} />
								}
							/>

							<LabeledNavItem
								to="/app/about"
								label={t(m.aboutTabLabel)}
								icon={<Icon name="material-symbols-info" size={30} />}
							/>
						</Stack>
					</List>
				</Box>
				<Box component="main" display="flex" overflow="auto">
					<Outlet />
				</Box>
			</Box>
		</Box>
	)
}

function LabeledNavItem({
	icon,
	label,
	...linkOptions
}: LinkOptions & {
	icon: ReactNode
	label: string
}) {
	return (
		<ListItem {...SHARED_NAV_ITEM_PROPS.listItem}>
			<ButtonLink
				{...SHARED_NAV_ITEM_PROPS.link}
				{...linkOptions}
				variant="text"
				color="inherit"
				size="small"
				sx={{
					...SHARED_NAV_ITEM_PROPS.link.sx,
					color: DARK_GREY,
				}}
			>
				<Stack
					direction="column"
					alignItems="center"
					flexWrap="wrap"
					textAlign="center"
				>
					{icon}
					{label}
				</Stack>
			</ButtonLink>
		</ListItem>
	)
}

const SHARED_NAV_ITEM_PROPS = {
	listItem: {
		dense: true,
		disablePadding: true,
		disableGutters: true,
		sx: {
			justifyContent: 'center',
		},
	},
	link: {
		activeProps: {
			sx: {
				color: COMAPEO_BLUE,
				borderRadius: 2,
			},
		},
		sx: {
			borderRadius: 2,
		},
	},
} as const

const m = defineMessages({
	aboutTabLabel: {
		id: 'routes.app.route.aboutTabLabel',
		defaultMessage: 'About CoMapeo',
	},
	exchangeTabLabel: {
		id: 'routes.app.route.exchangeTabLabel',
		defaultMessage: 'Exchange',
	},
	dataAndPrivacyTabLabel: {
		id: 'routes.app.route.dataAndPrivacyTabLabel',
		defaultMessage: 'Data & Privacy',
	},
	appSettingsTabLabel: {
		id: 'routes.app.route.appSettingsTabLabel',
		defaultMessage: 'App Settings',
	},
})
