import type { ReactNode } from 'react'
import {
	useManyDocs,
	useManyMembers,
	useOwnRoleInProject,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, DARKER_ORANGE } from '../../../../../colors.ts'
import { Icon } from '../../../../../components/icon.tsx'
import { ButtonLink } from '../../../../../components/link.tsx'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../../lib/comapeo.ts'
import { getLocaleStateQueryOptions } from '../../../../../lib/queries/app-settings.ts'
import { DataList } from './-data-list.tsx'

export const Route = createFileRoute('/app/projects/$projectId/_main-tabs/')({
	loader: async ({ context, params }) => {
		const {
			projectApi,
			queryClient,
			localeState: { value: lang },
		} = context
		const { projectId } = params

		await Promise.all([
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
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'observation',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.observation.getMany({ lang })
				},
			}),
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'track',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.track.getMany({ lang })
				},
			}),
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'preset',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.preset.getMany({ lang })
				},
			}),
		])
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { projectId } = Route.useParams()

	const { formatMessage: t } = useIntl()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const { data: observations } = useManyDocs({
		projectId,
		docType: 'observation',
		lang,
	})

	const { data: tracks } = useManyDocs({
		projectId,
		docType: 'track',
		lang,
	})

	const { data: activeMembers } = useManyMembers({
		projectId,
		includeLeft: false,
	})

	const { data: ownRole } = useOwnRoleInProject({ projectId })

	const selfIsAtLeastCoordinator =
		ownRole.roleId === CREATOR_ROLE_ID || ownRole.roleId === COORDINATOR_ROLE_ID

	const hasDataToShow = observations.length + tracks.length > 0

	if (selfIsAtLeastCoordinator && activeMembers.length < 2 && !hasDataToShow) {
		return (
			<IntroPanel
				title={t(m.inviteCollaboratorsPanelTitle)}
				description={t(m.inviteCollaboratorsPanelDescription)}
				icon={
					<Icon
						name="material-person-add"
						size={120}
						htmlColor={DARKER_ORANGE}
					/>
				}
				link={
					<ButtonLink
						to="/app/projects/$projectId/team/invite"
						params={{ projectId }}
						startIcon={<Icon name="material-person-add" />}
						sx={{ maxWidth: 400 }}
						variant="contained"
						fullWidth
					>
						{t(m.inviteCollaboratorsPanelInviteLink)}
					</ButtonLink>
				}
			/>
		)
	}

	if (!hasDataToShow) {
		return (
			<IntroPanel
				title={t(m.openExchangePanelTitle)}
				description={t(m.openExchangePanelDescription)}
				icon={
					<Icon
						name="material-offline-bolt-outlined"
						size={150}
						htmlColor={BLUE_GREY}
					/>
				}
				link={
					<ButtonLink
						to="/app/projects/$projectId/exchange"
						params={{ projectId }}
						startIcon={<Icon name="material-offline-bolt-outlined" />}
						sx={{ maxWidth: 400 }}
						variant="contained"
						fullWidth
					>
						{t(m.openExchangePanelLink)}
					</ButtonLink>
				}
			/>
		)
	}

	return <DataList projectId={projectId} />
}

function IntroPanel({
	icon,
	title,
	description,
	link,
}: {
	icon: ReactNode
	title: string
	description: string
	link: ReactNode
}) {
	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Stack direction="column" flex={1} padding={6} gap={10}>
				<Stack
					direction="column"
					flex={1}
					gap={4}
					alignItems="center"
					justifyContent="center"
					padding={4}
				>
					<Box>{icon}</Box>

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{title}
					</Typography>

					<Typography textAlign="center">{description}</Typography>
				</Stack>

				<Box display="flex" justifyContent="center" alignItems="center">
					{link}
				</Box>
			</Stack>
		</Stack>
	)
}

const m = defineMessages({
	inviteCollaboratorsPanelTitle: {
		id: 'routes.app.projects.$projectId.index.inviteCollaboratorsPanelTitle',
		defaultMessage: 'Invite Collaborators',
		description:
			'Text for title of panel shown when no active collaborators or data exist on project.',
	},
	inviteCollaboratorsPanelDescription: {
		id: 'routes.app.projects.$projectId.index.inviteCollaboratorsPanelDescription',
		defaultMessage:
			'Invite devices to start gathering observations and tracks.',
		description:
			'Text for description of panel shown when no active collaborators or data exist on project.',
	},
	inviteCollaboratorsPanelInviteLink: {
		id: 'routes.app.projects.$projectId.index.inviteCollaboratorsPanelInviteLink',
		defaultMessage: 'Invite Device',
		description: 'Text for link that navigates to invite page.',
	},
	openExchangePanelTitle: {
		id: 'routes.app.projects.$projectId.index.openExchangePanelTitle',
		defaultMessage: 'Exchange to Gather Observations',
		description:
			'Text for title of panel shown when project has collaborators but no data.',
	},
	openExchangePanelDescription: {
		id: 'routes.app.projects.$projectId.index.openExchangePanelDescription',
		defaultMessage: 'All observations and tracks will be listed here.',
		description:
			'Text for description of panel shown when project has collaborators but no data.',
	},
	openExchangePanelLink: {
		id: 'routes.app.projects.$projectId.index.openExchangePanelLink',
		defaultMessage: 'Open Exchange',
		description: 'Text for link that navigates to exchange page.',
	},
})
