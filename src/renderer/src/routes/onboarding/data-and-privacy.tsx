import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { DARKER_ORANGE, DARK_GREY, LIGHT_GREY } from '../../colors'
import { Icon } from '../../components/icon'
import { ButtonLink } from '../../components/link'

export const Route = createFileRoute('/onboarding/data-and-privacy')({
	staticData: {
		onboardingStepNumber: 1,
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	return (
		<Stack
			display="flex"
			direction="column"
			justifyContent="space-between"
			flex={1}
			gap={10}
			bgcolor={LIGHT_GREY}
			padding={10}
			borderRadius={2}
			overflow="auto"
		>
			<Container maxWidth="sm" component={Stack} direction="column" gap={5}>
				<Box alignSelf="center">
					<Icon
						name="material-symbols-encrypted-weight200"
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

			<Stack direction="row" justifyContent="center" gap={5}>
				<ButtonLink
					to="/onboarding/privacy-policy"
					variant="outlined"
					fullWidth
					sx={{ maxWidth: 400 }}
				>
					{t(m.learnMore)}
				</ButtonLink>
				<ButtonLink
					to="/onboarding/device-name"
					variant="contained"
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
		description: 'Title for review data and privacy page in onboarding.',
	},
	description: {
		id: 'routes.onboarding.data-and-privacy.description',
		defaultMessage:
			'CoMapeo allows teams to map offline without needing internet servers.',
		description: 'Description for review data and privacy page in onboarding.',
	},
	learnMore: {
		id: 'routes.onboarding.data-and-privacy.learnMore',
		defaultMessage: 'Learn More',
		description:
			'Text for link that navigates to external URL for additional information info about data and privacy.',
	},
	next: {
		id: 'routes.onboarding.data-and-privacy.next',
		defaultMessage: 'Next',
		description: 'Text for link to next step in onboarding.',
	},
	dataStays: {
		id: 'routes.onboarding.data-and-privacy.dataStays',
		defaultMessage: 'Your data stays on your devices.',
		description: 'Detail about data staying on device.',
	},
	dataEncrypted: {
		id: 'routes.onboarding.data-and-privacy.dataEncrypted',
		defaultMessage: 'All data stays fully encrypted.',
		description: 'Detail about data being fully encrypted.',
	},
	sharingAndCollaboration: {
		id: 'routes.onboarding.data-and-privacy.sharingAndCollaboration',
		defaultMessage: 'Easily manage and control sharing and collaboration.',
		description: 'Detail about data sharing and collaboration.',
	},
	privateByDefault: {
		id: 'routes.onboarding.data-and-privacy.privateByDefault',
		defaultMessage:
			'Private by default — diagnostic information is made fully anonymous and you can opt-out any time.',
		description: 'Detail about privacy by default.',
	},
})
