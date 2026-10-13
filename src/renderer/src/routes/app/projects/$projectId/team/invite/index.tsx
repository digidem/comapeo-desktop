import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_05, ORANGE_00 } from '../../../../../../../../shared/colors.ts'
import { GenericRoutePendingComponent } from '../../../../../../components/generic-route-pending-component.tsx'
import { Icon } from '../../../../../../components/icon.tsx'
import { ButtonLink } from '../../../../../../components/link.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../../hooks/icon.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../../../lib/comapeo.ts'

export const Route = createFileRoute('/app/projects/$projectId/team/invite/')({
	beforeLoad: async ({ context, params }) => {
		const { projectApi, queryClient } = context
		const { projectId } = params

		const members = await queryClient.query({
			staleTime: 'static',
			queryKey: [
				COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
				'projects',
				projectId,
				'members',
				{ includeLeft: true },
			],
			queryFn: async () => {
				return projectApi.$member.getMany({ includeLeft: true })
			},
		})

		if (members.length > 1) {
			throw Route.redirect({
				to: '/app/projects/$projectId/team/invite/devices',
				params: { projectId },
				replace: true,
			})
		}
	},
	pendingComponent: GenericRoutePendingComponent,
	component: RouteComponent,
})

function RouteComponent() {
	const intl = useIntl()
	const router = useRouter()

	const { projectId } = Route.useParams()

	const addIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	const backIconSize = useIconSizeBasedOnTypography({
		variant: 'pageTitle',
		multiplier: 1.25,
	})

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				component="header"
				direction="row"
				sx={{
					alignItems: 'center',
					borderBottom: `1px solid ${BLUE_05}`,
					gap: 2,
					paddingBlock: 4,
					paddingInline: 6,
				}}
			>
				<IconButton
					aria-label={intl.formatMessage(m.goBackAccessibleLabel)}
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
					<Icon name="material-arrow-back" size={backIconSize} />
				</IconButton>

				<Typography variant="pageTitle">
					{intl.formatMessage(m.navTitle)}
				</Typography>
			</Stack>

			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Container
					maxWidth="sm"
					sx={{
						display: 'flex',
						flex: 1,
						flexDirection: 'column',
						paddingBlock: 6,
						paddingInline: 4,
					}}
				>
					<Stack
						direction="column"
						sx={{ flex: 1, gap: 10, justifyContent: 'space-between' }}
					>
						<Stack
							direction="column"
							sx={{
								border: `1px solid ${BLUE_05}`,
								borderRadius: 2,
								flex: 1,
								justifyContent: 'center',
								gap: 20,
								overflowWrap: 'break-word',
								padding: 6,
							}}
						>
							<Stack direction="column" sx={{ gap: 6 }}>
								<Box sx={{ alignSelf: 'center' }}>
									<Icon
										name="material-person-add"
										htmlColor={ORANGE_00}
										size={addIconSize}
									/>
								</Box>

								<Typography variant="heroHeader" sx={{ textAlign: 'center' }}>
									{intl.formatMessage(m.inviteCollaborators)}
								</Typography>

								<Typography
									variant="heroSubheading"
									sx={{ textAlign: 'center' }}
								>
									{intl.formatMessage(m.primaryDescription)}
								</Typography>
							</Stack>

							<Stack
								component={List}
								direction="column"
								sx={{
									alignSelf: 'center',
									color: (theme) => theme.palette.text.secondary,
									gap: 2,
									listStyleType: 'disc',
									paddingInline: 8,
								}}
							>
								<ListItem sx={{ display: 'list-item' }}>
									{intl.formatMessage(m.onlyInvitedDevices)}
								</ListItem>

								<ListItem sx={{ display: 'list-item' }}>
									{intl.formatMessage(m.shareUsingExchange)}
								</ListItem>

								<ListItem sx={{ display: 'list-item' }}>
									{intl.formatMessage(m.controlSharing)}
								</ListItem>
							</Stack>
						</Stack>

						<Box
							sx={{
								display: 'flex',
								flexDirection: 'row',
								justifyContent: 'center',
							}}
						>
							<ButtonLink
								fullWidth
								to="/app/projects/$projectId/team/invite/devices"
								params={{ projectId }}
								replace
								type="button"
							>
								{intl.formatMessage(m.selectDevice)}
							</ButtonLink>
						</Box>
					</Stack>
				</Container>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	navTitle: {
		id: '$1.routes.app.projects.$projectId.team.invite.index.navTitle',
		defaultMessage: 'Get Started',
		description: 'Title of the Invite Get Started page.',
	},
	inviteCollaborators: {
		id: '$1.routes.app.projects.$projectId.team.invite.index.inviteCollaborators',
		defaultMessage: 'Invite Collaborators',
		description: 'Title of the Invite Get Started page.',
	},
	primaryDescription: {
		id: '$1.routes.app.projects.$projectId.team.invite.index.primaryDescription',
		defaultMessage: 'Invite devices using CoMapeo to start collaborating.',
		description: 'Primary description text.',
	},
	onlyInvitedDevices: {
		id: '$1.routes.app.projects.$projectId.team.invite.index.onlyInvitedDevices',
		defaultMessage: 'Only invited devices contribute.',
		description: 'Detail about who contributes.',
	},
	shareUsingExchange: {
		id: '$1.routes.app.projects.$projectId.team.invite.index.shareUsingExchange',
		defaultMessage: 'Collaborators share securely using Exchange.',
		description: 'Detail about how collaborators share data.',
	},
	controlSharing: {
		id: '$1.routes.app.projects.$projectId.team.invite.index.controlSharing',
		defaultMessage: 'Control sharing in Project Settings.',
		description: 'Detail about how to control data sharing.',
	},
	selectDevice: {
		id: '$1.routes.app.projects.$projectId.team.invite.index.selectDevice',
		defaultMessage: 'Select a Device',
		description: 'Text for button to navigate to device selection.',
	},
	goBackAccessibleLabel: {
		id: 'routes.app.projects.$projectId.team.invite.index.goBackAccessibleLabel',
		defaultMessage: 'Go back.',
		description: 'Accessible label for back button.',
	},
})
