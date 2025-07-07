import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DARKER_ORANGE, DARK_GREY, LIGHT_GREY } from '../../colors'
import { ButtonLink } from '../../components/button-link'
import { Icon } from '../../components/icon'

export const Route = createFileRoute('/onboarding/data-and-privacy')({
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	return (
		<Stack
			display="flex"
			useFlexGap
			direction="column"
			justifyContent="space-between"
			flex={1}
			gap={10}
			bgcolor={LIGHT_GREY}
			padding={5}
			borderRadius={2}
			overflow="auto"
		>
			<Container
				maxWidth="sm"
				component={Stack}
				direction="column"
				useFlexGap
				gap={5}
			>
				<Box alignSelf="center">
					<Icon
						name="material-symbols-encrypted"
						size={80}
						htmlColor={DARKER_ORANGE}
					/>
				</Box>

				<Typography variant="h1" fontWeight={500} textAlign="center">
					{t(m.title)}
				</Typography>

				<Typography variant="h2" fontWeight={400} textAlign="center">
					{t(m.description)}
				</Typography>

				<List sx={{ color: DARK_GREY, listStyleType: 'disc' }}>
					<ListItem disablePadding sx={{ display: 'list-item', paddingY: 1 }}>
						{t(m.dataEncrypted)}
					</ListItem>
					<ListItem disablePadding sx={{ display: 'list-item', paddingY: 1 }}>
						{t(m.dataStays)}
					</ListItem>
					<ListItem disablePadding sx={{ display: 'list-item', paddingY: 1 }}>
						{t(m.sharingAndCollaboration)}
					</ListItem>
					<ListItem disablePadding sx={{ display: 'list-item', paddingY: 1 }}>
						{t(m.privateByDefault)}
					</ListItem>
				</List>
			</Container>
			<Stack direction="row" justifyContent="center" useFlexGap gap={5}>
				<ButtonLink
					to="/onboarding/privacy-policy"
					variant="outlined"
					size="large"
					disableElevation
					fullWidth
					sx={{ maxWidth: 400 }}
				>
					{t(m.learnMore)}
				</ButtonLink>
				<ButtonLink
					to="/onboarding/device-name"
					variant="contained"
					size="large"
					disableElevation
					fullWidth
					sx={{ maxWidth: 400 }}
				>
					{t(m.next)}
				</ButtonLink>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.onboarding.data-and-privacy.title',
		defaultMessage: 'Review Data & Privacy',
	},
	description: {
		id: 'routes.onboarding.data-and-privacy.description',
		defaultMessage:
			'CoMapeo allows teams to map offline without needing internet servers.',
	},
	learnMore: {
		id: 'routes.onboarding.data-and-privacy.learnMore',
		defaultMessage: 'Learn More',
	},
	next: {
		id: 'routes.onboarding.data-and-privacy.next',
		defaultMessage: 'Next',
	},
	dataStays: {
		id: 'routes.onboarding.data-and-privacy.dataStays',
		defaultMessage: 'Your data stays on your devices.',
	},
	dataEncrypted: {
		id: 'routes.onboarding.data-and-privacy.dataEncrypted',
		defaultMessage: 'All data stays fully encrypted.',
	},
	sharingAndCollaboration: {
		id: 'routes.onboarding.data-and-privacy.sharingAndCollaboration',
		defaultMessage: 'Easily manage and control sharing and collaboration.',
	},
	privateByDefault: {
		id: 'routes.onboarding.data-and-privacy.privateByDefault',
		defaultMessage:
			'Private by default — diagnostic information is made fully anonymous and you can opt-out any time.',
	},
})
