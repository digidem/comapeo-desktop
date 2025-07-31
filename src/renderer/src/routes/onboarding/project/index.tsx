import { useEffect } from 'react'
import { useManyInvites } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import {
	BLUE_GREY,
	DARKER_ORANGE,
	DARK_GREY,
	LIGHT_GREY,
} from '../../../colors'
import { Icon } from '../../../components/icon'
import { ButtonLink } from '../../../components/link'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../lib/comapeo'

export const Route = createFileRoute('/onboarding/project/')({
	loader: async ({ context }) => {
		const { clientApi, queryClient } = context

		// TODO: not ideal to do this but requires major changes to @comapeo/core-react
		await queryClient.ensureQueryData({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'invites'],
			queryFn: async () => {
				return clientApi.invite.getMany()
			},
		})
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const navigate = useNavigate()
	const { data: invites } = useManyInvites()

	useEffect(() => {
		const pendingInvite = invites.find((i) => i.state === 'pending')

		if (pendingInvite) {
			navigate({
				to: '/onboarding/project/join/$inviteId',
				params: { inviteId: pendingInvite.inviteId },
			})
		}
	}, [invites, navigate])

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
				textAlign="center"
			>
				<Box alignSelf="center">
					<Icon
						name="material-person-add"
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
						{t(m.securelyStore)}
					</ListItem>
					<ListItem disablePadding sx={{ display: 'list-item', paddingY: 1 }}>
						{t(m.limitedToDevices)}
					</ListItem>
				</List>
			</Container>

			<Container
				maxWidth="sm"
				component={Stack}
				direction="column"
				alignItems="center"
				useFlexGap
				gap={8}
			>
				<Divider sx={{ backgroundColor: BLUE_GREY, alignSelf: 'stretch' }} />

				<Typography variant="h2" fontWeight={400}>
					{t(m.startingNewProject)}
				</Typography>

				<ButtonLink
					to="/onboarding/project/create"
					variant="outlined"
					size="large"
					disableElevation
					fullWidth
					sx={{ maxWidth: 400 }}
				>
					{t(m.createProject)}
				</ButtonLink>
			</Container>
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.onboarding.project.title',
		defaultMessage: 'Join a Project',
	},
	description: {
		id: 'routes.onboarding.project.description',
		defaultMessage: 'Ask a monitoring coordinator to join their Project.',
	},
	securelyStore: {
		id: 'routes.onboarding.project.securelyStore',
		defaultMessage:
			'Projects help teams securely store and share their territory monitoring data and observations.',
	},
	limitedToDevices: {
		id: 'routes.onboarding.project.limitedToDevices',
		defaultMessage:
			'Sharing observations and data are limited to devices within each Project.',
	},
	startingNewProject: {
		id: 'routes.onboarding.project.startingNewProject',
		defaultMessage: 'Starting a new territory monitoring project?',
	},
	createProject: {
		id: 'routes.onboarding.project.createProject',
		defaultMessage: 'Create a Project',
	},
})
