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
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, BLUE_GREY, DARK_COMAPEO_BLUE } from '../../colors'
import { ButtonLink } from '../../components/button-link'
// TODO: Remove `?url` after getting rid of vite-plugin-svgr
import TOPO_IMAGE_URL from '../../images/TopoLogo.svg?url'
import LOCK_IMAGE_URL from '../../images/closed_lock_with_key.png'
import RAISED_FIST_IMAGE_URL from '../../images/raised_fist_medium_skin_tone.png'
import RAISED_HAND_IMAGE_URL from '../../images/raised_hand_medium_skin_tone.png'
import WORLD_MAP_IMAGE_URL from '../../images/world_map.png'

export const Route = createFileRoute('/Onboarding/')({
	component: Onboarding,
})

const m = defineMessages({
	getStarted: {
		id: 'screens.IntroToCoMapeo.getStarted',
		defaultMessage: 'Get Started',
	},
	appDescription: {
		id: 'screens.IntroToCoMapeo.appDescription',
		defaultMessage:
			'View and manage observations collected with CoMapeo Mobile.',
	},
	mapAnywhere: {
		id: 'screens.IntroToCoMapeo.mapAnywhere',
		defaultMessage: 'Map anywhere and everywhere',
	},
	collaborate: {
		id: 'screens.IntroToCoMapeo.collaborate',
		defaultMessage: 'Collaborate on projects',
	},
	ownData: {
		id: 'screens.IntroToCoMapeo.ownData',
		defaultMessage: 'Own and control your data',
	},
	designedFor: {
		id: 'screens.IntroToCoMapeo.designedFor',
		defaultMessage:
			'Designed with and for Indigenous peoples & frontline communities',
	},
	comapeoDesktop: {
		id: 'screens.IntroToCoMapeo.comapeoDesktop',
		defaultMessage: '<b><orange>Co</orange>Mapeo</b> <blue>Desktop</blue>',
	},
})

const LIST_BACKGROUND_COLOR = alpha(BLACK, 0.4)

function Onboarding() {
	const { formatMessage: t } = useIntl()
	const theme = useTheme()

	const viewportIsNarrow = useMediaQuery(theme.breakpoints.down('md'))

	return (
		<Box
			bgcolor={DARK_COMAPEO_BLUE}
			flexDirection="column"
			minHeight="100vh"
			display="flex"
			justifyContent="center"
			alignItems="center"
			padding={5}
			sx={{
				backgroundImage: `url("${TOPO_IMAGE_URL}")`,
				backgroundRepeat: 'no-repeat',
				backgroundPosition: 'center',
				backgroundSize: 'contain',
			}}
		>
			<Container maxWidth="lg">
				<Stack useFlexGap display="flex" alignItems="center" gap={25}>
					<Grid container spacing={10} justifyContent="center">
						<Grid
							container
							alignItems="center"
							size={viewportIsNarrow ? 8 : 5}
							textAlign={viewportIsNarrow ? 'center' : undefined}
						>
							<Stack useFlexGap spacing={5}>
								<Typography variant="bannerTitle" color="textInverted">
									{t(m.comapeoDesktop)}
								</Typography>
								<Typography variant="bannerSubtitle" color="textInverted">
									{t(m.appDescription)}
								</Typography>
							</Stack>
						</Grid>
						<Grid size={viewportIsNarrow ? 8 : 5} container>
							<Stack
								useFlexGap
								display="flex"
								justifyContent="center"
								paddingX={5}
								paddingY={6}
								borderRadius={2}
								bgcolor={LIST_BACKGROUND_COLOR}
								borderColor={BLUE_GREY}
								sx={{
									borderWidth: 1,
									borderStyle: 'solid',
								}}
							>
								<List>
									<ListItem sx={{ gap: 5 }}>
										<img src={WORLD_MAP_IMAGE_URL} height={30} width={30} />
										<ListItemText
											slotProps={{ primary: { color: 'textInverted' } }}
										>
											{t(m.mapAnywhere)}
										</ListItemText>
									</ListItem>
									<ListItem sx={{ gap: 5 }}>
										{/* TODO: Replace with correct image */}
										<img src={RAISED_HAND_IMAGE_URL} height={30} width={30} />
										<ListItemText
											slotProps={{ primary: { color: 'textInverted' } }}
										>
											{t(m.collaborate)}
										</ListItemText>
									</ListItem>
									<ListItem sx={{ gap: 5 }}>
										<img src={LOCK_IMAGE_URL} height={30} width={30} />
										<ListItemText
											slotProps={{ primary: { color: 'textInverted' } }}
										>
											{t(m.ownData)}
										</ListItemText>
									</ListItem>
									<ListItem sx={{ gap: 5 }}>
										<img src={RAISED_FIST_IMAGE_URL} height={30} width={30} />

										<ListItemText
											slotProps={{ primary: { color: 'textInverted' } }}
										>
											{t(m.designedFor)}
										</ListItemText>
									</ListItem>
								</List>
							</Stack>
						</Grid>
					</Grid>

					<ButtonLink
						to="/Onboarding/DataPrivacy"
						fullWidth
						size="large"
						variant="contained"
						sx={{ maxWidth: 400 }}
					>
						{t(m.getStarted)}
					</ButtonLink>
				</Stack>
			</Container>
		</Box>
	)
}
