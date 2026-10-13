import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { createFileRoute } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageTag,
	type NoMessageValues,
} from 'react-intl'

import { BLACK_00, BLUE_GREY, DARK_COMAPEO_BLUE } from '../colors.ts'
import { Icon } from '../components/icon.tsx'
import { Blue, Bold, Orange } from '../components/intl-rich-text.tsx'
import { ButtonLink } from '../components/link.tsx'
import topographicPrintURL from '../images/topographic-print.svg'

export const Route = createFileRoute('/welcome')({
	component: RouteComponent,
})

const LIST_BACKGROUND_COLOR = alpha(BLACK_00, 0.4)

function RouteComponent() {
	const intl = useIntl()

	return (
		<Box
			sx={{
				alignItems: 'center',
				background: DARK_COMAPEO_BLUE,
				backgroundImage: `url("${topographicPrintURL}")`,
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
				backgroundSize: 'contain',
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				justifyContent: 'center',
			}}
		>
			<Container
				disableGutters
				maxWidth="md"
				sx={{ overflow: 'auto', padding: 6 }}
			>
				<Stack
					direction="column"
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 25,
					}}
				>
					<Stack direction="row" sx={{ flexWrap: 'wrap', gap: 10 }}>
						<Stack direction="column" sx={{ flex: 1, gap: 5 }}>
							<Typography
								component="h1"
								color="textInverted"
								sx={{
									fontSize: '6rem',
									fontWeight: (theme) => theme.typography.fontWeightRegular,
									lineHeight: 1,
								}}
							>
								{intl.formatMessage(m.comapeoDesktop, {
									b: Bold,
									blue: Blue,
									orange: Orange,
								})}
							</Typography>

							<Typography
								color="textInverted"
								sx={{
									fontSize: '1.5rem',
									fontWeight: (theme) => theme.typography.fontWeightMedium,
									lineHeight: 1.25,
								}}
							>
								{intl.formatMessage(m.appDescription)}
							</Typography>
						</Stack>

						<Stack
							component={List}
							direction="column"
							sx={{
								background: LIST_BACKGROUND_COLOR,
								border: `1px solid ${BLUE_GREY}`,
								borderRadius: 2,
								color: (theme) => theme.palette.text.inverted,
								flex: 1,
								gap: 4,
								justifyContent: 'center',
								padding: 6,
								minWidth: 300,
							}}
						>
							<ListItem sx={{ gap: 5 }}>
								<Icon name="openmoji-world-map" />

								<ListItemText>{intl.formatMessage(m.mapAnywhere)}</ListItemText>
							</ListItem>

							<ListItem sx={{ gap: 5 }}>
								<Icon name="openmoji-handshake-medium-skin-tone" />

								<ListItemText>{intl.formatMessage(m.collaborate)}</ListItemText>
							</ListItem>

							<ListItem sx={{ gap: 5 }}>
								<Icon name="openmoji-locked-with-key" />

								<ListItemText>{intl.formatMessage(m.ownData)}</ListItemText>
							</ListItem>

							<ListItem sx={{ gap: 5 }}>
								<Icon name="openmoji-raised-fist-medium-skin-tone" />

								<ListItemText>{intl.formatMessage(m.designedFor)}</ListItemText>
							</ListItem>
						</Stack>
					</Stack>

					<ButtonLink
						fullWidth
						to="/onboarding/data-and-privacy"
						variant="contained"
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
