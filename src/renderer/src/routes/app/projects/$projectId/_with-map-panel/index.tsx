import {
	useManyDocs,
	useManyMembers,
	useOwnRoleInProject,
} from '@comapeo/core-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { endOfToday } from 'date-fns'
import { defineMessages, useIntl } from 'react-intl'

import { ORANGE_00 } from '../../../../../../../shared/colors.ts'
import { Icon } from '../../../../../components/icon.tsx'
import { ButtonLink } from '../../../../../components/link.tsx'
import {
	PanelBody,
	PanelHeader,
	PanelLayout,
} from '../../../../../components/panel-layout.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../../lib/comapeo.ts'
import { getLocaleStateQueryOptions } from '../../../../../lib/queries/app-settings.ts'
import { DataList } from './-data-list.tsx'
import { dateSearchParamsToFilter } from './-shared.ts'

export const Route = createFileRoute(
	'/app/projects/$projectId/_with-map-panel/',
)({
	loader: async ({ context, params }) => {
		const {
			projectApi,
			queryClient,
			localeState: { value: lang },
		} = context
		const { projectId } = params

		await Promise.all([
			queryClient.query({
				staleTime: 'static',
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
			queryClient.query({
				staleTime: 'static',
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
			queryClient.query({
				staleTime: 'static',
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
			queryClient.query({
				staleTime: 'static',
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

		return { todayDate: endOfToday() }
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { projectId } = Route.useParams()

	const intl = useIntl()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const { data: observations } = useManyDocs({
		projectId,
		docType: 'observation',
		lang,
	})

	const { data: tracks } = useManyDocs({ projectId, docType: 'track', lang })

	const { data: activeMembers } = useManyMembers({
		projectId,
		includeLeft: false,
	})

	const { data: ownRole } = useOwnRoleInProject({ projectId })

	const selfIsAtLeastCoordinator =
		ownRole.roleId === CREATOR_ROLE_ID || ownRole.roleId === COORDINATOR_ROLE_ID

	const hasDataToShow = observations.length + tracks.length > 0

	const introPanelIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	if (selfIsAtLeastCoordinator && activeMembers.length < 2 && !hasDataToShow) {
		return (
			<PanelLayout>
				<PanelHeader
					icon={
						<Icon
							htmlColor={ORANGE_00}
							name="material-person-add"
							size={introPanelIconSize}
						/>
					}
					title={intl.formatMessage(m.inviteCollaboratorsPanelTitle)}
					description={intl.formatMessage(
						m.inviteCollaboratorsPanelDescription,
					)}
				/>

				<PanelBody>
					<ButtonLink
						to="/app/projects/$projectId/team/invite"
						params={{ projectId }}
						variant="text"
					>
						{intl.formatMessage(m.inviteCollaboratorsPanelInviteLink)}
					</ButtonLink>
				</PanelBody>
			</PanelLayout>
		)
	}

	if (!hasDataToShow) {
		return (
			<PanelLayout>
				<PanelHeader
					icon={
						<Icon
							htmlColor={ORANGE_00}
							name="material-offline-bolt-outlined"
							size={introPanelIconSize}
						/>
					}
					title={intl.formatMessage(m.openExchangePanelTitle)}
					description={intl.formatMessage(m.openExchangePanelDescription)}
				/>

				<PanelBody>
					<ButtonLink
						to="/app/projects/$projectId/team/invite"
						params={{ projectId }}
						variant="text"
					>
						{intl.formatMessage(m.inviteCollaboratorsPanelInviteLink)}
					</ButtonLink>
				</PanelBody>
			</PanelLayout>
		)
	}

	return <RouteAwareDataList projectId={projectId} />
}

function RouteAwareDataList({ projectId }: { projectId: string }) {
	const todayDate = Route.useLoaderData({
		select: (data) => {
			return data.todayDate
		},
	})

	const categoriesFilter = Route.useSearch({
		select: (value) => {
			return value?.categories
		},
	})

	const dateFilter = Route.useSearch({
		select: (value) => {
			return dateSearchParamsToFilter(value)
		},
	})

	return (
		<DataList
			categoriesFilter={categoriesFilter}
			dateFilter={dateFilter}
			filterReferenceDate={todayDate}
			projectId={projectId}
		/>
	)
}

const m = defineMessages({
	inviteCollaboratorsPanelTitle: {
		id: '$1.routes.app.projects.$projectId.index.inviteCollaboratorsPanelTitle',
		defaultMessage: 'Invite Collaborators',
		description:
			'Text for title of panel shown when no active collaborators or data exist on project.',
	},
	inviteCollaboratorsPanelDescription: {
		id: '$1.routes.app.projects.$projectId.index.inviteCollaboratorsPanelDescription',
		defaultMessage:
			'Invite devices to start gathering observations and tracks.',
		description:
			'Text for description of panel shown when no active collaborators or data exist on project.',
	},
	inviteCollaboratorsPanelInviteLink: {
		id: '$1.routes.app.projects.$projectId.index.inviteCollaboratorsPanelInviteLink',
		defaultMessage: 'Invite Devices',
		description: 'Text for link that navigates to invite page.',
	},
	openExchangePanelTitle: {
		id: '$1.routes.app.projects.$projectId.index.openExchangePanelTitle',
		defaultMessage: 'Exchange to Gather Observations',
		description:
			'Text for title of panel shown when project has collaborators but no data.',
	},
	openExchangePanelDescription: {
		id: '$1.routes.app.projects.$projectId.index.openExchangePanelDescription',
		defaultMessage: 'All observations and tracks will be listed here.',
		description:
			'Text for description of panel shown when project has collaborators but no data.',
	},
	openExchangePanelLink: {
		id: '$1.routes.app.projects.$projectId.index.openExchangePanelLink',
		defaultMessage: 'Go to Exchange',
		description: 'Text for link that navigates to exchange page.',
	},
})
