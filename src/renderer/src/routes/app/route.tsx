import { type ReactNode } from 'react'
import { useSyncState } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import { useIsMutating } from '@tanstack/react-query'
import {
	Outlet,
	createFileRoute,
	redirect,
	useChildMatches,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, COMAPEO_BLUE, DARK_GREY, WHITE } from '../../colors'
import { Icon } from '../../components/icon'
import {
	ButtonLink,
	IconButtonLink,
	type ButtonLinkProps,
} from '../../components/link'
import { GLOBAL_MUTATIONS_BASE_KEY } from '../../lib/queries/global-mutations'

export const Route = createFileRoute('/app')({
	beforeLoad: ({ context, matches, preload }) => {
		let activeProjectId = context.activeProjectIdStore.instance.getState()

		if (!activeProjectId) {
			for (const m of matches) {
				if ('projectId' in m.params) {
					activeProjectId = m.params.projectId

					if (!preload) {
						context.activeProjectIdStore.actions.update(activeProjectId)
					}

					continue
				}
			}
		}

		if (!activeProjectId) {
			throw new Error('Could not determine most recent project ID')
		}

		// Redirect to project-specific "initial" page if the current route is the just /app
		if (matches.at(-1)!.fullPath === '/app') {
			throw redirect({
				to: '/app/projects/$projectId',
				params: { projectId: activeProjectId },
				replace: true,
			})
		}

		return { activeProjectId }
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const activeProjectId = Route.useRouteContext({
		select: (context) => context.activeProjectId,
	})

	const currentRoute = useChildMatches({
		select: (matches) => {
			return matches.at(-1)!
		},
	})

	const syncState = useSyncState({ projectId: activeProjectId })
	const syncEnabled = syncState?.data.isSyncEnabled

	const pageHasEditing =
		currentRoute.routeId === '/app/settings/device-name' ||
		currentRoute.routeId === '/app/settings/coordinate-system' ||
		currentRoute.routeId === '/app/settings/language' ||
		currentRoute.routeId === '/app/projects/$projectId/settings/info' ||
		currentRoute.routeId ===
			'/app/projects/$projectId/invite/devices/$deviceId/role' ||
		currentRoute.routeId ===
			'/app/projects/$projectId/invite/devices/$deviceId/send'

	const someGlobalMutationIsPending =
		useIsMutating({ mutationKey: GLOBAL_MUTATIONS_BASE_KEY }) > 0

	return (
		<Box bgcolor={WHITE} height="100%">
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
								disabled={
									((pageHasEditing || someGlobalMutationIsPending) &&
										!currentRoute.fullPath.startsWith(
											'/app/projects/$projectId',
										)) ||
									(syncEnabled &&
										currentRoute.routeId ===
											'/app/projects/$projectId/exchange/')
								}
								to="/app/projects/$projectId"
								params={{ projectId: activeProjectId }}
								onClick={(event) => {
									if (someGlobalMutationIsPending) {
										event.preventDefault()
									}
								}}
								activeProps={{
									...SHARED_NAV_ITEM_PROPS.link.activeProps,
									sx: {
										...SHARED_NAV_ITEM_PROPS.link.activeProps.sx,
										color:
											currentRoute.routeId ===
											'/app/projects/$projectId/exchange/'
												? DARK_GREY
												: COMAPEO_BLUE,
										border: `2px solid currentColor`,
									},
								}}
								sx={{
									...SHARED_NAV_ITEM_PROPS.link.sx,
									border: `2px solid currentColor`,
								}}
								aria-label={t(m.projectTabAccessibleLabel)}
							>
								<Icon name="comapeo-cards" size={30} />
							</IconButtonLink>
						</ListItem>

						<Stack direction="column" gap={5}>
							<LabeledNavItem
								to="/app/projects/$projectId/exchange"
								params={{ projectId: activeProjectId }}
								disabled={
									(pageHasEditing || someGlobalMutationIsPending) &&
									!currentRoute.fullPath.startsWith(
										'/app/projects/$projectId/exchange',
									)
								}
								label={t(m.exchangeTabLabel)}
								icon={<Icon name="material-offline-bolt" size={30} />}
							/>

							<LabeledNavItem
								to="/app/settings"
								disabled={
									((pageHasEditing || someGlobalMutationIsPending) &&
										!currentRoute.fullPath.startsWith('/app/settings')) ||
									(currentRoute.routeId ===
										'/app/projects/$projectId/exchange/' &&
										syncEnabled)
								}
								label={t(m.appSettingsTabLabel)}
								icon={<Icon name="material-settings" size={30} />}
							/>

							<LabeledNavItem
								to="/app/data-and-privacy"
								disabled={
									((pageHasEditing || someGlobalMutationIsPending) &&
										currentRoute.fullPath !== '/app/data-and-privacy') ||
									(currentRoute.routeId ===
										'/app/projects/$projectId/exchange/' &&
										syncEnabled)
								}
								label={t(m.dataAndPrivacyTabLabel)}
								icon={
									<Icon name="material-symbols-encrypted-weight400" size={30} />
								}
							/>

							<LabeledNavItem
								to="/app/about"
								disabled={
									((pageHasEditing || someGlobalMutationIsPending) &&
										currentRoute.fullPath !== '/app/about') ||
									(currentRoute.routeId ===
										'/app/projects/$projectId/exchange/' &&
										syncEnabled)
								}
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
}: ButtonLinkProps & {
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
	projectTabAccessibleLabel: {
		id: 'routes.app.route.projectTabAccessibleLabel',
		defaultMessage: 'View project.',
		description: 'Accessible label for project tab link in navigation.',
	},
})
