import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
	Outlet,
	createFileRoute,
	useChildMatches,
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
		<Stack direction="column" flex={1} overflow="auto">
			<Stack direction="column" gap={6} padding={6}>
				<Stack direction="row" gap={4} alignItems="center" flex={1}>
					<Icon
						name="material-arrow-back"
						size={headerIconHeight}
						htmlColor={DARK_GREY}
					/>

					<Breadcrumbs component="nav" aria-label="breadcrumb">
						<TextLink to="/app/settings" sx={{ textDecoration: 'none' }}>
							{t(m.comapeoSettingsBreadCrumbLink)}
						</TextLink>

						<TextLink
							id={BREADCRUMB_NAV_CURRENT_PAGE_LINK_ID}
							to="."
							aria-current="page"
							sx={{ textDecoration: 'none' }}
						>
							<Typography color="textPrimary" fontWeight={500}>
								{t(currentRoute.staticData.getNavTitle!())}
							</Typography>
						</TextLink>
					</Breadcrumbs>
				</Stack>
			</Stack>

			<Box paddingInline={6}>
				<Divider variant="fullWidth" sx={{ borderColor: BLUE_GREY }} />
			</Box>

			<Box
				overflow="auto"
				display="flex"
				flex={1}
				sx={{ scrollbarGutter: 'stable both-edges' }}
			>
				<Outlet />
			</Box>
		</Stack>
	)
}

const m = defineMessages({
	comapeoSettingsBreadCrumbLink: {
		id: 'routes.app.settings.comapeoSettingsBreadCrumbLink',
		defaultMessage: 'CoMapeo Settings',
		description:
			'Text for breadcrumb link to go to main CoMapeo settings page when viewing nested settings page.',
	},
})
