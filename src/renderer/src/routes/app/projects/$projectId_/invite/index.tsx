import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARK_GREY, DARK_ORANGE } from '../../../../../colors'
import { GenericRoutePendingComponent } from '../../../../../components/generic-route-pending-component'
import { Icon } from '../../../../../components/icon'
import { ButtonLink } from '../../../../../components/link'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../../lib/comapeo'

export const Route = createFileRoute('/app/projects/$projectId_/invite/')({
	beforeLoad: async ({ context, params }) => {
		const { projectApi, queryClient } = context
		const { projectId } = params

		const members = await queryClient.ensureQueryData({
			queryKey: [
				COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
				'projects',
				projectId,
				'members',
			],
			queryFn: async () => {
				return projectApi.$member.getMany()
			},
		})

		if (members.length > 1) {
			throw Route.redirect({
				to: '/app/projects/$projectId/invite/devices',
				params: { projectId },
				replace: true,
			})
		}
	},
	pendingComponent: GenericRoutePendingComponent,
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const router = useRouter()

	const { projectId } = Route.useParams()

	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Stack
				direction="row"
				alignItems="center"
				component="nav"
				gap={4}
				padding={4}
				borderBottom={`1px solid ${BLUE_GREY}`}
			>
				<IconButton
					aria-label={t(m.goBackAccessibleLabel)}
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({
							to: '/app/projects/$projectId/settings',
							params: { projectId },
							replace: true,
						})
					}}
				>
					<Icon name="material-arrow-back" size={30} />
				</IconButton>

				<Typography variant="h1" fontWeight={500}>
					{t(m.navTitle)}
				</Typography>
			</Stack>

			<Stack
				direction="column"
				flex={1}
				justifyContent="space-between"
				overflow="auto"
				padding={6}
				gap={6}
			>
				<Stack
					direction="column"
					borderRadius={2}
					border={`1px solid ${BLUE_GREY}`}
					flex={1}
					justifyContent="center"
					gap={5}
					padding={6}
				>
					<Box alignSelf="center">
						<Icon
							name="material-person-add"
							htmlColor={DARK_ORANGE}
							size={128}
						/>
					</Box>

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.inviteCollaborators)}
					</Typography>

					<Typography textAlign="center" color="textSecondary" fontWeight={500}>
						{t(m.primaryDescription)}
					</Typography>

					<List
						sx={{
							alignSelf: 'center',
							listStyleType: 'disc',
							paddingInline: 8,
							color: DARK_GREY,
						}}
					>
						<ListItem disablePadding sx={{ display: 'list-item' }}>
							<Typography color="textSecondary">
								{t(m.onlyInvitedDevices)}
							</Typography>
						</ListItem>

						<ListItem disablePadding sx={{ display: 'list-item' }}>
							<Typography color="textSecondary">
								{t(m.shareUsingExchange)}
							</Typography>
						</ListItem>

						<ListItem disablePadding sx={{ display: 'list-item' }}>
							<Typography color="textSecondary">
								{t(m.controlSharing)}
							</Typography>
						</ListItem>
					</List>
				</Stack>

				<Box display="flex" flexDirection="row" justifyContent="center">
					<ButtonLink
						to="/app/projects/$projectId/invite/devices"
						params={{ projectId }}
						replace
						type="button"
						fullWidth
						sx={{ maxWidth: 400 }}
					>
						{t(m.selectDevice)}
					</ButtonLink>
				</Box>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId_.invite.index.navTitle',
		defaultMessage: 'Get Started',
		description: 'Title of the Invite Get Started page.',
	},
	inviteCollaborators: {
		id: 'routes.app.projects.$projectId_.invite.index.inviteCollaborators',
		defaultMessage: 'Invite Collaborators',
		description: 'Title of the Invite Get Started page.',
	},
	primaryDescription: {
		id: 'routes.app.projects.$projectId_.invite.index.primaryDescription',
		defaultMessage: 'Invite devices using CoMapeo to start collaborating.',
		description: 'Primary description text.',
	},
	onlyInvitedDevices: {
		id: 'routes.app.projects.$projectId_.invite.index.onlyInvitedDevices',
		defaultMessage: 'Only invited devices contribute.',
		description: 'Detail about who contributes.',
	},
	shareUsingExchange: {
		id: 'routes.app.projects.$projectId_.invite.index.shareUsingExchange',
		defaultMessage: 'Collaborators share securely using Exchange.',
		description: 'Detail about how collaborators share data.',
	},
	controlSharing: {
		id: 'routes.app.projects.$projectId_.invite.index.controlSharing',
		defaultMessage: 'Control sharing in Project Settings.',
		description: 'Detail about how to control data sharing.',
	},
	selectDevice: {
		id: 'routes.app.projects.$projectId_.invite.index.selectDevice',
		defaultMessage: 'Select a Device',
		description: 'Text for button to navigate to device selection.',
	},
	goBackAccessibleLabel: {
		id: 'routes.app.projects.$projectId_.invite.index.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button.',
	},
})
