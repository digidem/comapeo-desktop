import { useMemo, type ReactNode } from 'react'
import { useOwnRoleInProject, useProjectSettings } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARK_GREY } from '../../../../../colors'
import { Icon } from '../../../../../components/icon'
import { TextLink } from '../../../../../components/link'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../../lib/comapeo'

export const Route = createFileRoute('/app/projects/$projectId_/settings/')({
	loader: async ({ context, params }) => {
		const {
			projectApi,
			queryClient,
			localeState: { value: lang },
		} = context
		const { projectId } = params

		await Promise.all([
			// TODO: Not ideal but requires changes in @comapeo/core-react
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'project_settings',
				],
				queryFn: async () => {
					return projectApi.$getProjectSettings()
				},
			}),
			// TODO: Not ideal but requires changes in @comapeo/core-react
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'role',
				],
				queryFn: async () => {
					return projectApi.$getOwnRole()
				},
			}),
			// TODO: Not ideal but requires changes in @comapeo/core-react
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'observations',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.observation.getMany({ lang })
				},
			}),
		])
	},
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

	const theme = useTheme()

	const iconSize = useMemo(() => {
		return `calc(${theme.typography.h1.fontSize} * ${theme.typography.h1.lineHeight} * 1.25)`
	}, [theme.typography.h1.fontSize, theme.typography.h1.lineHeight])

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
				<Stack
					direction="column"
					flexDirection="column"
					flex={1}
					useFlexGap
					gap={6}
				>
					<SettingsItem
						title={projectSettings.name || t(m.unnamedProject)}
						description={projectSettings.projectDescription}
						icon={
							<Icon
								name="comapeo-cards"
								htmlColor={DARK_GREY}
								size={iconSize}
							/>
						}
						action={
							isAtLeastCoordinator ? (
								<Box>
									<TextLink
										to="/app/projects/$projectId/settings/info"
										params={{ projectId }}
										underline="none"
									>
										{t(m.editInfo)}
									</TextLink>
								</Box>
							) : undefined
						}
					/>

					<SettingsItem
						title={t(m.collaborators)}
						description={t(
							isAtLeastCoordinator
								? m.deviceIsCoordinator
								: m.deviceIsParticipant,
						)}
						icon={
							<Icon
								name="material-manage-accounts-filled"
								htmlColor={DARK_GREY}
								size={iconSize}
							/>
						}
						action={
							isAtLeastCoordinator ? (
								<Box>
									<TextLink
										// TODO: Not implemented yet
										// to="/app/projects/$projectId/settings/team"
										onClick={() => {
											alert('Not implemented yet')
										}}
										params={{ projectId }}
										underline="none"
									>
										{t(m.viewTeam)}
									</TextLink>
								</Box>
							) : undefined
						}
					/>

					<SettingsItem
						title={t(m.categoriesSet)}
						description={projectSettings.configMetadata?.name || 'No name'}
						icon={
							<Icon
								name="material-category"
								htmlColor={DARK_GREY}
								size={iconSize}
							/>
						}
						action={
							isAtLeastCoordinator ? (
								<Box>
									<TextLink
										to="/app/projects/$projectId/settings/categories"
										params={{ projectId }}
										underline="none"
									>
										{t(m.updateCategoriesSet)}
									</TextLink>
								</Box>
							) : undefined
						}
					/>
				</Stack>
			</Box>
		</Stack>
	)
}

function SettingsItem({
	action,
	description,
	icon,
	title,
}: {
	action?: ReactNode
	description?: string
	icon: ReactNode
	title: string
}) {
	return (
		<Stack
			direction="row"
			useFlexGap
			gap={5}
			borderRadius={2}
			border={`1px solid ${BLUE_GREY}`}
			padding={5}
			alignItems="flex-start"
		>
			{icon}

			<Stack
				direction="column"
				useFlexGap
				gap={5}
				justifyContent="space-between"
			>
				<Typography variant="h1" fontWeight={500}>
					{title}
				</Typography>

				{description ? (
					<Typography sx={{ color: DARK_GREY }}>{description}</Typography>
				) : null}

				{action}
			</Stack>
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
	deviceIsCoordinator: {
		id: 'routes.app.projects.$projectId_.settings.index.deviceIsCoordinator',
		defaultMessage: 'This device is a coordinator on this project.',
		description:
			'Indicates that device is a coordinator on the current project.',
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
	updateCategoriesSet: {
		id: 'routes.app.projects.$projectId_.settings.index.updateCategoriesSet',
		defaultMessage: 'Update Set',
		description: 'Text for link that navigates to project categories set page.',
	},
})
