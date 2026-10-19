import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { createFileRoute } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageTag,
	type NoMessageValues,
} from 'react-intl'

import { BLACK, BLUE_GREY, DARK_COMAPEO_BLUE } from '../colors.ts'
import { Icon } from '../components/icon.tsx'
import { Blue, Bold, Orange } from '../components/intl-rich-text.tsx'
import { ButtonLink } from '../components/link.tsx'
import topographicPrintURL from '../images/topographic-print.svg'

export const Route = createFileRoute('/welcome')({
	component: RouteComponent,
})

const LIST_BACKGROUND_COLOR = alpha(BLACK, 0.4)

function RouteComponent() {
	const intl = useIntl()

	const theme = useTheme()

	const viewportIsNarrow = useMediaQuery(theme.breakpoints.down('md'))

	return (
		<Box
			sx={{
				height: '100%',
				bgcolor: DARK_COMAPEO_BLUE,
				flexDirection: 'column',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundImage: `url("${topographicPrintURL}")`,
				backgroundRepeat: 'no-repeat',
				backgroundPosition: 'center',
				backgroundSize: 'contain',
			}}
		>
			<Container maxWidth="lg" sx={{ overflow: 'auto', padding: 5 }}>
				<Stack sx={{ display: 'flex', alignItems: 'center', gap: 25 }}>
					<Grid container spacing={10} sx={{ justifyContent: 'center' }}>
						<Grid
							container
							size={viewportIsNarrow ? 8 : 5}
							sx={{
								alignItems: 'center',
								textAlign: viewportIsNarrow ? 'center' : undefined,
							}}
						>
							<Stack spacing={5}>
								<Typography
									component="h1"
									variant="bannerTitle"
									color="textInverted"
									sx={{ fontWeight: 'inherit' }}
								>
									{intl.formatMessage(m.comapeoDesktop, {
										b: Bold,
										blue: Blue,
										orange: Orange,
									})}
								</Typography>

								<Typography
									component="p"
									variant="bannerSubtitle"
									color="textInverted"
								>
									{intl.formatMessage(m.appDescription)}
								</Typography>
							</Stack>
						</Grid>
						<Grid size={viewportIsNarrow ? 8 : 5} container>
							<Stack
								sx={{
									display: 'flex',
									justifyContent: 'center',
									paddingX: 5,
									paddingY: 6,
									borderRadius: 2,
									bgcolor: LIST_BACKGROUND_COLOR,
									borderColor: BLUE_GREY,
									borderWidth: 1,
									borderStyle: 'solid',
								}}
							>
								<List>
									<ListItem sx={{ gap: 5 }}>
										<Icon name="openmoji-world-map" />
										<ListItemText
											slotProps={{ primary: { color: 'textInverted' } }}
										>
											{intl.formatMessage(m.mapAnywhere)}
										</ListItemText>
									</ListItem>
									<ListItem sx={{ gap: 5 }}>
										<Icon name="openmoji-handshake-medium-skin-tone" />
										<ListItemText
											slotProps={{ primary: { color: 'textInverted' } }}
										>
											{intl.formatMessage(m.collaborate)}
										</ListItemText>
									</ListItem>
									<ListItem sx={{ gap: 5 }}>
										<Icon name="openmoji-locked-with-key" />
										<ListItemText
											slotProps={{ primary: { color: 'textInverted' } }}
										>
											{intl.formatMessage(m.ownData)}
										</ListItemText>
									</ListItem>
									<ListItem sx={{ gap: 5 }}>
										<Icon name="openmoji-raised-fist-medium-skin-tone" />
										<ListItemText
											slotProps={{ primary: { color: 'textInverted' } }}
										>
											{intl.formatMessage(m.designedFor)}
										</ListItemText>
									</ListItem>
								</List>
							</Stack>
						</Grid>
					</Grid>

					<ButtonLink
						to="/onboarding/data-and-privacy"
						fullWidth
						variant="contained"
						sx={{ maxWidth: 400 }}
					>
						{intl.formatMessage(m.getStarted)}
					</ButtonLink>
				</Stack>
			</Container>
		</Box>
	)
}

const m = defineMessages<{
	readonly getStarted: NoMessageValues
	readonly appDescription: NoMessageValues
	readonly mapAnywhere: NoMessageValues
	readonly collaborate: NoMessageValues
	readonly ownData: NoMessageValues
	readonly designedFor: NoMessageValues
	readonly comapeoDesktop: {
		readonly b: MessageTag
		readonly blue: MessageTag
		readonly orange: MessageTag
	}
}>({
	getStarted: {
		id: '$1.routes.welcome.getStarted',
		defaultMessage: 'Get Started',
		description: 'Text for link to navigate to next step.',
	},
	appDescription: {
		id: '$1.routes.welcome.appDescription',
		defaultMessage:
			'View and manage observations collected with CoMapeo Mobile.',
		description: 'Description of app in welcome page.',
	},
	mapAnywhere: {
		id: '$1.routes.welcome.mapAnywhere',
		defaultMessage: 'Map anywhere and everywhere',
		description: 'Detail about mapping in welcome page.',
	},
	collaborate: {
		id: '$1.routes.welcome.collaborate',
		defaultMessage: 'Collaborate on projects',
		description: 'Detail about collaborating in welcome page.',
	},
	ownData: {
		id: '$1.routes.welcome.ownData',
		defaultMessage: 'Own and control your data',
		description: 'Detail about owning data in welcome page.',
	},
	designedFor: {
		id: '$1.routes.welcome.designedFor',
		defaultMessage:
			'Designed with and for Indigenous peoples & frontline communities',
		description: 'Detail about who app is designed for in welcome page.',
	},
	comapeoDesktop: {
		id: '$1.routes.welcome.comapeoDesktop',
		defaultMessage: '<b><orange>Co</orange>Mapeo</b> <blue>Desktop</blue>',
		description: 'Name of app displayed in welcome page.',
	},
})
