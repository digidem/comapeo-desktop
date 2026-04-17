import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
	Outlet,
	createFileRoute,
	useChildMatches,
	useRouter,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARK_GREY } from '../../../../colors.ts'
import { Icon } from '../../../../components/icon.tsx'
import { TextLink } from '../../../../components/link.tsx'
import { useIconSizeBasedOnTypography } from '../../../../hooks/icon.ts'
import { BREADCRUMB_NAV_CURRENT_PAGE_LINK_ID } from './-shared.ts'

export const Route = createFileRoute('/app/settings/_nested')({
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()

	const { formatMessage: t } = useIntl()

	const currentRoute = useChildMatches({
		select: (matches) => {
			const match = matches.at(-1)!

			if (!match?.staticData.getNavTitle) {
				throw new Error(
					`Expected route ${match.routeId} to have \`staticData.getNavTitle()\``,
				)
			}

			return match
		},
	})

	const headerIconHeight = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 1.5,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack direction="column" sx={{ gap: 6, padding: 6 }}>
				<Stack direction="row" sx={{ gap: 4, alignItems: 'center', flex: 1 }}>
					<IconButton
						onClick={() => {
							if (router.history.canGoBack()) {
								router.history.back()
								return
							}

							router.navigate({ to: '/app/settings', replace: true })
						}}
						aria-label={t(m.goBackAccessibleLabel)}
					>
						<Icon
							name="material-arrow-back"
							size={headerIconHeight}
							htmlColor={DARK_GREY}
						/>
					</IconButton>

					<Breadcrumbs
						component="nav"
						aria-label={t(m.breadCrumbAccessibleLabel)}
					>
						<TextLink to="/app/settings" sx={{ textDecoration: 'none' }}>
							{t(m.comapeoSettingsBreadCrumbLink)}
						</TextLink>

						<TextLink
							id={BREADCRUMB_NAV_CURRENT_PAGE_LINK_ID}
							to="."
							aria-current="page"
							sx={{ textDecoration: 'none' }}
						>
							<Typography color="textPrimary" sx={{ fontWeight: 500 }}>
								{t(currentRoute.staticData.getNavTitle!())}
							</Typography>
						</TextLink>
					</Breadcrumbs>
				</Stack>
			</Stack>

			<Box sx={{ paddingInline: 6 }}>
				<Divider variant="fullWidth" sx={{ borderColor: BLUE_GREY }} />
			</Box>

			<Box
				sx={{
					overflow: 'auto',
					display: 'flex',
					flex: 1,
					scrollbarGutter: 'stable both-edges',
				}}
			>
				<Outlet />
			</Box>
		</Stack>
	)
}

const m = defineMessages({
	breadCrumbAccessibleLabel: {
		id: 'routes.app.settings.breadCrumbAccessibleLabel',
		defaultMessage: 'breadcrumb',
		description:
			'Accessible label for breadcrumb navigation when viewing nested settings page.',
	},
	comapeoSettingsBreadCrumbLink: {
		id: '$1.routes.app.settings.comapeoSettingsBreadCrumbLink',
		defaultMessage: 'CoMapeo Settings',
		description:
			'Text for breadcrumb link to go to main CoMapeo settings page when viewing nested settings page.',
	},
	goBackAccessibleLabel: {
		id: 'routes.app.settings.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button',
	},
})
