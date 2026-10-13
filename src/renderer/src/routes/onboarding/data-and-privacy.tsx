import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK_03, ORANGE_00 } from '../../../../shared/colors.ts'
import { Icon } from '../../components/icon.tsx'
import { ButtonLink } from '../../components/link.tsx'
import { useIconSizeBasedOnTypography } from '../../hooks/icon.ts'

export const Route = createFileRoute('/onboarding/data-and-privacy')({
	staticData: { onboardingStepNumber: 1 },
	component: RouteComponent,
})

function RouteComponent() {
	const intl = useIntl()

	const iconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	return (
		<Stack
			direction="column"
			sx={{
				background: BLACK_03,
				borderRadius: 2,
				flex: 1,
				gap: 10,
				justifyContent: 'space-between',
				overflow: 'auto',
				padding: 10,
			}}
		>
			<Container
				maxWidth="sm"
				component={Stack}
				direction="column"
				sx={{ gap: 5 }}
			>
				<Box sx={{ alignSelf: 'center' }}>
					<Icon
						name="material-symbols-encrypted-weight200"
						htmlColor={ORANGE_00}
						size={iconSize}
					/>
				</Box>

				<Typography
					component="h1"
					variant="heroHeader"
					sx={{ textAlign: 'center' }}
				>
					{intl.formatMessage(m.title)}
				</Typography>

				<Typography variant="heroSubheading" sx={{ textAlign: 'center' }}>
					{intl.formatMessage(m.description)}
				</Typography>

				<Stack
					component={List}
					direction="column"
					sx={{
						color: (theme) => theme.palette.text.secondary,
						gap: 4,
						listStyleType: 'disc',
					}}
				>
					<ListItem sx={{ display: 'list-item' }}>
						{intl.formatMessage(m.dataEncrypted)}
					</ListItem>

					<ListItem sx={{ display: 'list-item' }}>
						{intl.formatMessage(m.dataStays)}
					</ListItem>

					<ListItem sx={{ display: 'list-item' }}>
						{intl.formatMessage(m.sharingAndCollaboration)}
					</ListItem>

					<ListItem sx={{ display: 'list-item' }}>
						{intl.formatMessage(m.privateByDefault)}
					</ListItem>
				</Stack>
			</Container>

			<Stack
				direction="row"
				sx={{ flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}
			>
				<ButtonLink
					to="/onboarding/privacy-policy"
					variant="outlined"
					sx={{ flex: 1 }}
				>
					{intl.formatMessage(m.learnMore)}
				</ButtonLink>

				<ButtonLink
					to="/onboarding/device-name"
					variant="contained"
					sx={{ flex: 1 }}
				>
					{intl.formatMessage(m.next)}
				</ButtonLink>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: '$1.routes.onboarding.data-and-privacy.title',
		defaultMessage: 'Review Data & Privacy',
		description: 'Title for review data and privacy page in onboarding.',
	},
	description: {
		id: '$1.routes.onboarding.data-and-privacy.description',
		defaultMessage:
			'CoMapeo allows teams to map offline without needing internet servers.',
		description: 'Description for review data and privacy page in onboarding.',
	},
	learnMore: {
		id: '$1.routes.onboarding.data-and-privacy.learnMore',
		defaultMessage: 'Learn More',
		description:
			'Text for link that navigates to external URL for additional information info about data and privacy.',
	},
	next: {
		id: '$1.routes.onboarding.data-and-privacy.next',
		defaultMessage: 'Next',
		description: 'Text for link to next step in onboarding.',
	},
	dataStays: {
		id: '$1.routes.onboarding.data-and-privacy.dataStays',
		defaultMessage: 'Your data stays on your devices.',
		description: 'Detail about data staying on device.',
	},
	dataEncrypted: {
		id: '$1.routes.onboarding.data-and-privacy.dataEncrypted',
		defaultMessage: 'All data stays fully encrypted.',
		description: 'Detail about data being fully encrypted.',
	},
	sharingAndCollaboration: {
		id: '$1.routes.onboarding.data-and-privacy.sharingAndCollaboration',
		defaultMessage: 'Easily manage and control sharing and collaboration.',
		description: 'Detail about data sharing and collaboration.',
	},
	privateByDefault: {
		id: '$1.routes.onboarding.data-and-privacy.privateByDefault',
		defaultMessage:
			'Private by default — diagnostic information is made fully anonymous and you can opt-out any time.',
		description: 'Detail about privacy by default.',
	},
})
