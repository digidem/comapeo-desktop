import { useMemo } from 'react'
import {
	useManyDocs,
	useOwnRoleInProject,
	useProjectSettings,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import {
	BLACK,
	BLUE_GREY,
	DARK_GREY,
	LIGHT_COMAPEO_BLUE,
	LIGHT_GREY,
	WHITE,
} from '../../../../colors'
import { Icon } from '../../../../components/icon'
import { ButtonLink } from '../../../../components/link'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	getMatchingPresetForObservation,
} from '../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../lib/queries/app-settings'

export const Route = createFileRoute('/app/projects/$projectId/')({
	loader: async ({ context, params }) => {
		const {
			clientApi,
			queryClient,
			localeState: { value: lang },
		} = context
		const { projectId } = params

		let projectApi
		try {
			// TODO: Not ideal but requires changes in @comapeo/core-react
			// Copied from https://github.com/digidem/comapeo-core-react/blob/e56979321e91440ad6e291521a9e3ce8eb91200d/src/lib/react-query/projects.ts#L29-L31
			projectApi = await queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects', projectId],
				queryFn: async () => {
					return clientApi.getProject(projectId)
				},
			})
		} catch {
			throw notFound()
		}

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
			// TODO: Not ideal but requires changes in @comapeo/core-react
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'presets',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.preset.getMany({ lang })
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

const BOX_SHADOW = `0px 1px 5px 0px ${alpha(BLACK, 0.25)}`

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const { projectId } = Route.useParams()

	const { data: projectSettings } = useProjectSettings({ projectId })
	const { data: role } = useOwnRoleInProject({ projectId })

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const { data: observations } = useManyDocs({
		projectId,
		docType: 'observation',
		lang,
	})

	const { data: presets } = useManyDocs({
		projectId,
		docType: 'preset',
		lang,
	})

	const observationsWithPreset = useMemo(() => {
		return observations.map((o) => ({
			observation: o,
			preset: getMatchingPresetForObservation(o.tags, presets),
		}))
	}, [observations, presets])

	const isAtLeastCoordinator =
		role.roleId === CREATOR_ROLE_ID || role.roleId === COORDINATOR_ROLE_ID

	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Box padding={6}>
				<Stack
					direction="column"
					useFlexGap
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

					<Stack direction="row" useFlexGap gap={3} alignItems="center">
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

					<Stack direction="row" useFlexGap gap={5} justifyContent="center">
						<ButtonLink
							fullWidth
							variant="outlined"
							size="large"
							to="/app/projects/$projectId/settings"
							params={{ projectId }}
							sx={{ maxWidth: 400 }}
						>
							{t(m.view)}
						</ButtonLink>

						<ButtonLink
							fullWidth
							variant="contained"
							size="large"
							to="/app/projects/$projectId/settings"
							params={{ projectId }}
							disabled={!isAtLeastCoordinator}
							startIcon={<Icon name="material-person-add" />}
							sx={{
								maxWidth: 400,
								visibility: isAtLeastCoordinator ? undefined : 'hidden',
							}}
						>
							{t(m.invite)}
						</ButtonLink>
					</Stack>
				</Stack>
			</Box>

			<Divider sx={{ bgcolor: LIGHT_GREY }} />

			<Box
				padding={6}
				overflow="auto"
				display="flex"
				flexDirection="column"
				flex={1}
			>
				{observationsWithPreset.length > 0 ? (
					// TODO: Render observations
					<Stack direction="column" flexDirection="column" flex={1}></Stack>
				) : (
					<AddObservationsCard projectId={projectId} />
				)}
			</Box>
		</Stack>
	)
}

function AddObservationsCard({ projectId }: { projectId: string }) {
	const { formatMessage: t } = useIntl()

	return (
		<Stack
			direction="column"
			useFlexGap
			gap={4}
			alignItems="center"
			borderRadius={2}
			border={`1px solid ${BLUE_GREY}`}
			paddingX={6}
			paddingY={10}
			justifyContent={'center'}
			flex={1}
		>
			<Box
				borderRadius="100%"
				bgcolor={LIGHT_COMAPEO_BLUE}
				display="flex"
				justifyContent="center"
				alignItems="center"
				padding={6}
			>
				<Icon name="comapeo-cards" htmlColor={WHITE} size={40} />
			</Box>

			<Typography variant="h1" textAlign="center" fontWeight={500}>
				{t(m.addObservationsTitle)}
			</Typography>

			<Typography textAlign="center" fontWeight={400}>
				{t(m.addObservationsDescription)}
			</Typography>

			<ButtonLink
				variant="text"
				to="/app/projects/$projectId/exchange"
				params={{ projectId }}
				sx={{ fontWeight: 400 }}
			>
				{t(m.goToExchange)}
			</ButtonLink>
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
	addObservationsTitle: {
		id: 'routes.app.projects.$projectId.index.addObservationsTitle',
		defaultMessage: 'Add Observations',
		description:
			'Title of card that is displayed when project has no observations to display.',
	},
	addObservationsDescription: {
		id: 'routes.app.projects.$projectId.index.addObservationsDescription',
		defaultMessage: 'Use Exchange to add Collaborator Observations',
		description:
			'Description of card that is displayed when project has no observations to display.',
	},
	goToExchange: {
		id: 'routes.app.projects.$projectId.index.goToExchange',
		defaultMessage: 'Go to Exchange',
		description: 'Link text to navigate to Exchange page.',
	},
})
