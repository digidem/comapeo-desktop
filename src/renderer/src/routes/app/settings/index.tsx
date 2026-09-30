import { Suspense } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY } from '../../../colors.ts'
import { Icon } from '../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../hooks/icon.ts'
import { AboutCoMapeoSection } from './-sections/about-comapeo-section.tsx'
import { CoordinateSystemSection } from './-sections/coordinate-system-section.tsx'
import { DataAndPrivacySection } from './-sections/data-and-privacy-section.tsx'
import { DeviceNameSection } from './-sections/device-name-section.tsx'
import { LanguageSection } from './-sections/language-section.tsx'
import { UnitSystemSection } from './-sections/unit-system-section.tsx'

export const Route = createFileRoute('/app/settings/')({
	component: RouteComponent,
})

function RouteComponent() {
	const intl = useIntl()

	const router = useRouter()

	const headerIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 1.5,
	})

	const sectionHeadingIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body2',
		multiplier: 1.5,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				component="header"
				direction="row"
				sx={{
					alignItems: 'center',
					borderBottom: `1px solid ${BLUE_GREY}`,
					gap: 2,
					padding: 4,
				}}
			>
				<IconButton
					aria-label={intl.formatMessage(m.goBackAccessibleLabel)}
					color="inherit"
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({ to: '/app', replace: true })
					}}
				>
					<Icon name="material-arrow-back" size={headerIconSize} />
				</IconButton>

				<Typography variant="h1" sx={{ fontWeight: 500, textAlign: 'center' }}>
					{intl.formatMessage(m.title)}
				</Typography>
			</Stack>

			<Stack
				sx={{ flex: 1, overflow: 'auto', scrollbarGutter: 'stable both-edges' }}
			>
				<Suspense
					fallback={
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								flex: 1,
							}}
						>
							<CircularProgress disableShrink />
						</Box>
					}
				>
					<Container maxWidth="sm" disableGutters>
						<Stack direction="column" sx={{ gap: 6, padding: 6 }}>
							<Stack direction="column" sx={{ gap: 8 }}>
								<DeviceNameSection headingIconSize={sectionHeadingIconSize} />

								<LanguageSection headingIconSize={sectionHeadingIconSize} />

								<CoordinateSystemSection
									headingIconSize={sectionHeadingIconSize}
								/>

								<UnitSystemSection headingIconSize={sectionHeadingIconSize} />
							</Stack>

							<Divider
								variant="fullWidth"
								sx={{ borderColor: (theme) => theme.darken(BLUE_GREY, 0.2) }}
							/>

							<DataAndPrivacySection />

							<Divider
								variant="fullWidth"
								sx={{ borderColor: (theme) => theme.darken(BLUE_GREY, 0.2) }}
							/>

							<AboutCoMapeoSection />
						</Stack>
					</Container>
				</Suspense>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	goBackAccessibleLabel: {
		id: 'routes.app.settings.index.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button.',
	},
	title: {
		id: '$1.routes.app.settings.index.title',
		defaultMessage: 'CoMapeo Settings',
		description: 'Title of the settings page.',
	},
})
