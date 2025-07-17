import type { ReactNode } from 'react'
import { useOwnRoleInProject, useProjectSettings } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARK_GREY } from '../../../../../colors'
import {
	ButtonLink,
	IconButtonLink,
	TextLink,
} from '../../../../../components/button-link'
import { Icon } from '../../../../../components/icon'
import {
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../../lib/comapeo'

export const Route = createFileRoute('/app/projects/$projectId_/settings/')({
	pendingComponent: () => {
		return (
			<Box
				display="flex"
				flexDirection="column"
				flex={1}
				justifyContent="center"
				alignItems="center"
			>
				<CircularProgress />
			</Box>
		)
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const router = useRouter()

	const { projectId } = Route.useParams()

	const { data: projectSettings } = useProjectSettings({ projectId })

	const { data: role } = useOwnRoleInProject({ projectId })

	const isAtLeastCoordinator =
		role.roleId === COORDINATOR_ROLE_ID || role.roleId === CREATOR_ROLE_ID

	return (
		<Stack direction="column" flex={1}>
			<Stack
				direction="row"
				alignItems="center"
				component="nav"
				useFlexGap
				gap={4}
				padding={4}
				borderBottom={`1px solid ${BLUE_GREY}`}
			>
				<IconButton
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						router.navigate({
							to: '/app/projects/$projectId',
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

			<Box
				padding={6}
				overflow="auto"
				display="flex"
				flexDirection="column"
				flex={1}
			>
				{isAtLeastCoordinator ? (
					<CoordinatorSettingsView
						projectId={projectId}
						projectName={projectSettings.name || t(m.unnamedProject)}
						projectDescription={
							projectSettings.projectDescription || t(m.noProjectDescription)
						}
						projectColor={projectSettings.projectColor}
					/>
				) : (
					<ParticipantSettingsView
						projectId={projectId}
						projectName={projectSettings.name || t(m.unnamedProject)}
						projectDescription={
							projectSettings.projectDescription || t(m.noProjectDescription)
						}
						projectColor={projectSettings.projectColor}
					/>
				)}
			</Box>
		</Stack>
	)
}

function ParticipantSettingsView({
	projectId,
	projectName,
	projectColor,
	projectDescription,
}: {
	projectId: string
	projectColor?: string
	projectName: string
	projectDescription?: string
}) {
	const { formatMessage: t } = useIntl()

	return (
		<Stack
			direction="column"
			flexDirection="column"
			flex={1}
			useFlexGap
			gap={6}
		>
			<Stack
				direction="row"
				useFlexGap
				gap={5}
				bgcolor={projectColor}
				borderRadius={2}
				border={`1px solid ${BLUE_GREY}`}
				padding={5}
				alignItems="flex-start"
			>
				<Icon name="comapeo-cards" htmlColor={DARK_GREY} size={30} />

				<Stack
					direction="column"
					useFlexGap
					gap={5}
					justifyContent="space-between"
				>
					<Typography variant="h1" fontWeight={500}>
						{projectName}
					</Typography>

					{projectDescription ? (
						<Typography sx={{ color: DARK_GREY }}>
							{projectDescription}
						</Typography>
					) : null}
				</Stack>
			</Stack>

			<Stack
				direction="row"
				useFlexGap
				gap={5}
				bgcolor={projectColor}
				borderRadius={2}
				border={`1px solid ${BLUE_GREY}`}
				padding={5}
				alignItems="flex-start"
			>
				<Icon
					name="material-manage-accounts-filled"
					htmlColor={DARK_GREY}
					size={30}
				/>

				<Stack
					direction="column"
					useFlexGap
					gap={5}
					justifyContent="space-between"
				>
					<Typography variant="h1" fontWeight={500}>
						{t(m.collaborators)}
					</Typography>

					<Typography sx={{ color: DARK_GREY }}>
						{t(m.deviceIsParticipant)}
					</Typography>

					<Box>
						<TextLink
							// TODO: Replace with `to`
							onClick={() => {
								alert('Not implemented yet')
							}}
							params={{ projectId }}
							underline="none"
						>
							{t(m.viewTeam)}
						</TextLink>
					</Box>
				</Stack>
			</Stack>
		</Stack>
	)
}

function CoordinatorSettingsView({
	projectId,
	projectName,
	projectColor,
	projectDescription,
}: {
	projectId: string
	projectColor?: string
	projectName: string
	projectDescription?: string
}) {
	const { formatMessage: t } = useIntl()

	return (
		<Stack
			direction="column"
			flexDirection="column"
			flex={1}
			useFlexGap
			gap={6}
		>
			<Stack
				direction="column"
				useFlexGap
				gap={3}
				bgcolor={projectColor}
				borderRadius={2}
				border={`1px solid ${BLUE_GREY}`}
				padding={5}
				alignItems="center"
			>
				<Typography variant="h1" fontWeight={500} textAlign="center">
					{projectName}
				</Typography>

				{projectDescription ? (
					<Typography textAlign="center" sx={{ color: DARK_GREY }}>
						{projectDescription}
					</Typography>
				) : null}

				<TextLink
					underline="none"
					onClick={() => {
						alert('Not implemented yet')
					}}
					params={{ projectId }}
				>
					{t(m.editInfo)}
				</TextLink>
			</Stack>

			<SettingsRow
				icon={
					<Icon
						name="material-manage-accounts-filled"
						htmlColor={DARK_GREY}
						size={30}
					/>
				}
				label={t(m.collaborators)}
				actionButton={
					<IconButtonLink
						// TODO: Replace with `to`
						onClick={() => {
							alert('Not implemented yet')
						}}
						params={{ projectId }}
					>
						<Icon
							name="material-chevron-right"
							htmlColor={DARK_GREY}
							size={30}
						/>
					</IconButtonLink>
				}
			/>

			<SettingsRow
				icon={<Icon name="material-category" htmlColor={DARK_GREY} size={30} />}
				label={t(m.categoriesSet)}
				actionButton={
					<IconButtonLink
						// TODO: Replace with `to`
						onClick={() => {
							alert('Not implemented yet')
						}}
						params={{ projectId }}
					>
						<Icon
							name="material-chevron-right"
							htmlColor={DARK_GREY}
							size={30}
						/>
					</IconButtonLink>
				}
			/>

			<SettingsRow
				icon={
					<Icon name="material-offline-bolt" htmlColor={DARK_GREY} size={30} />
				}
				label={t(m.noRemoteArchive)}
				actionButton={
					<ButtonLink
						variant="text"
						// TODO: Replace with `to`
						onClick={() => {
							alert('Not implemented yet')
						}}
						params={{ projectId }}
						sx={{ fontWeight: 400 }}
					>
						{t(m.addRemoteArchive)}
					</ButtonLink>
				}
			/>
		</Stack>
	)
}

// TODO: Make whole row clickable?
function SettingsRow({
	actionButton,
	icon,
	label,
}: {
	actionButton: ReactNode
	icon: ReactNode
	label: string
}) {
	return (
		<Stack
			direction="row"
			justifyContent="space-between"
			border={`1px solid ${BLUE_GREY}`}
			borderRadius={2}
			padding={4}
			alignItems="center"
		>
			<Stack
				direction="row"
				alignItems="center"
				useFlexGap
				gap={3}
				overflow="auto"
			>
				{icon}
				<Typography
					textOverflow="ellipsis"
					whiteSpace="nowrap"
					overflow="hidden"
					flex={1}
					fontWeight={500}
				>
					{label}
				</Typography>
			</Stack>
			{actionButton}
		</Stack>
	)
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId_.settings.index.navTitle',
		defaultMessage: 'Project Settings',
		description: 'Title of the project settings page.',
	},
	unnamedProject: {
		id: 'routes.app.projects.$projectId_.settings.index.unnamedProject',
		defaultMessage: 'Unnamed Project',
		description: 'Fallback for when current project is missing a name.',
	},
	editInfo: {
		id: 'routes.app.projects.$projectId_.settings.index.editInfo',
		defaultMessage: 'Edit Info',
		description:
			'Text for link that navigates to page for editing project settings.',
	},
	collaborators: {
		id: 'routes.app.projects.$projectId_.settings.index.collaborators',
		defaultMessage: 'Collaborators',
		description: 'Text for item that navigates to project collaborators page.',
	},
	categoriesSet: {
		id: 'routes.app.projects.$projectId_.settings.index.categoriesSet',
		defaultMessage: 'Categories Set',
		description: 'Text for item that navigates to project categories set page.',
	},
	noRemoteArchive: {
		id: 'routes.app.projects.$projectId_.settings.index.noRemoteArchive',
		defaultMessage: 'No Remote Archive',
		description:
			'Text for item that indicates that project has not added a remote archive.',
	},
	addRemoteArchive: {
		id: 'routes.app.projects.$projectId_.settings.index.addRemoteArchive',
		defaultMessage: 'Add',
		description:
			'Text for link that navigates to remote archive settings page.',
	},
	deviceIsParticipant: {
		id: 'routes.app.projects.$projectId_.settings.index.deviceIsParticpant',
		defaultMessage: 'This device is a participant on this project.',
		description:
			'Indicates that device is a participant on the current project.',
	},
	viewTeam: {
		id: 'routes.app.projects.$projectId_.settings.index.viewTeam',
		defaultMessage: 'View Team',
		description: 'Text for link that navigates to project team page.',
	},
	noProjectDescription: {
		id: 'routes.app.projects.$projectId_.settings.index.noProjectDescription',
		defaultMessage: 'No project description.',
		description: 'Indicates that the project does not have a description.',
	},
})
