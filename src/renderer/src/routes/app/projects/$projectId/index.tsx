import { Suspense } from 'react'
import { useOwnRoleInProject, useProjectSettings } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, DARK_GREY, LIGHT_GREY } from '#renderer/src/colors.ts'
import { Icon } from '#renderer/src/components/icon.tsx'
import { ButtonLink } from '#renderer/src/components/link.tsx'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '#renderer/src/lib/comapeo.ts'

import { DisplayedDataList } from './-displayed-data/list.tsx'

export const Route = createFileRoute('/app/projects/$projectId/')({
	loader: async ({ context, params }) => {
		const { projectApi, queryClient } = context
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
		])
	},
	component: RouteComponent,
})

const BOX_SHADOW = `0px 1px 5px 0px ${alpha(BLACK, 0.25)}`

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const { projectId } = Route.useParams()

	const { data: projectSettings } = useProjectSettings({ projectId })
	const { data: role } = useOwnRoleInProject({ projectId })

	const isAtLeastCoordinator =
		role.roleId === CREATOR_ROLE_ID || role.roleId === COORDINATOR_ROLE_ID

	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Box padding={6}>
				<Stack
					direction="column"
					gap={5}
					borderRadius={2}
					padding={6}
					boxShadow={BOX_SHADOW}
					bgcolor={projectSettings.projectColor}
					border={`2px solid ${LIGHT_GREY}`}
				>
					<Typography variant="h1" fontWeight={500}>
						{projectSettings.name || t(m.unnamedProject)}
					</Typography>

					<Stack direction="row" gap={3} alignItems="center">
						<Icon
							name={
								isAtLeastCoordinator
									? 'material-manage-accounts-filled'
									: 'material-people-filled'
							}
							htmlColor={DARK_GREY}
						/>
						<Typography fontWeight={400} sx={{ color: DARK_GREY }}>
							{t(
								isAtLeastCoordinator
									? m.youAreCoordinator
									: m.youAreParticipant,
							)}
						</Typography>
					</Stack>

					{isAtLeastCoordinator ? (
						<Stack direction="row" gap={5} justifyContent="center">
							<ButtonLink
								fullWidth
								variant="outlined"
								to="/app/projects/$projectId/settings"
								params={{ projectId }}
								sx={{ maxWidth: 400 }}
							>
								{t(m.view)}
							</ButtonLink>

							<ButtonLink
								fullWidth
								variant="contained"
								to="/app/projects/$projectId/invite"
								params={{ projectId }}
								startIcon={<Icon name="material-person-add" />}
								sx={{ maxWidth: 400 }}
							>
								{t(m.invite)}
							</ButtonLink>
						</Stack>
					) : null}
				</Stack>
			</Box>

			<Divider sx={{ bgcolor: LIGHT_GREY }} />

			<Box overflow="auto" display="flex" flexDirection="column" flex={1}>
				<Suspense
					fallback={
						<Box
							display="flex"
							flex={1}
							justifyContent="center"
							alignItems="center"
						>
							<CircularProgress />
						</Box>
					}
				>
					<DisplayedDataList projectId={projectId} />
				</Suspense>
			</Box>
		</Stack>
	)
}

const m = defineMessages({
	unnamedProject: {
		id: 'routes.app.projects.$projectId.index.unnamedProject',
		defaultMessage: 'Unnamed Project',
		description: 'Fallback for when current project is missing a name.',
	},
	youAreCoordinator: {
		id: 'routes.app.projects.$projectId.index.youAreCoordinator',
		defaultMessage: "You're a coordinator on this project.",
		description: 'Indicates that user is a coordinator on the current project.',
	},
	youAreParticipant: {
		id: 'routes.app.projects.$projectId.index.youAreParticipant',
		defaultMessage: "You're a participant on this project.",
		description: 'Indicates that user is a participant on the current project.',
	},
	view: {
		id: 'routes.app.projects.$projectId.index.view',
		defaultMessage: 'View',
		description: 'Link text to navigate to project settings page.',
	},
	invite: {
		id: 'routes.app.projects.$projectId.index.invite',
		defaultMessage: 'Invite',
		description: 'Link text to navigate to invite collaborators page.',
	},
})
