import * as React from 'react'
import { useManyDocs, useProjectSettings } from '@comapeo/core-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { EmptyState } from '../../components/Observations/EmptyState'
import { ObservationListView } from '../../components/Observations/ObservationListView'
import { ProjectHeader } from '../../components/Observations/ProjectHeader'
import { getActiveProjectIdQueryOptions } from '../../lib/queries/app-settings'

const m = defineMessages({
	loading: {
		id: 'mapMain.loading',
		defaultMessage: 'Loading...',
	},
	errorLoading: {
		id: 'mapMain.errorLoading',
		defaultMessage: 'Oops! Error loading data.',
	},
	unnamedProject: {
		id: 'mapMain.unnamedProject',
		defaultMessage: 'Unnamed Project',
	},
})

export const Route = createFileRoute('/(MapTabs)/_Map/main')({
	component: MainScreen,
})

export function MainScreen() {
	const navigate = useNavigate()
	const { formatMessage, locale } = useIntl()
	const { data: activeProjectId } = useSuspenseQuery(
		getActiveProjectIdQueryOptions(),
	)
	const { data: projectSettings, error: settingsError } = useProjectSettings({
		projectId: activeProjectId || '',
	})

	const {
		data: observations,
		error: obsError,
		isRefetching: isRefetchingObs,
	} = useManyDocs({
		projectId: activeProjectId || '',
		docType: 'observation',
		includeDeleted: false,
		lang: locale,
	})

	const {
		data: tracks,
		error: trackError,
		isRefetching: isRefetchingTracks,
	} = useManyDocs({
		projectId: activeProjectId || '',
		docType: 'track',
		includeDeleted: false,
		lang: locale,
	})

	const combinedData = React.useMemo(() => {
		const mappableObservations = observations ?? []
		const mappableTracks = tracks ?? []
		const allDocs = [...mappableObservations, ...mappableTracks].sort((a, b) =>
			a.createdAt < b.createdAt ? 1 : -1,
		)
		return allDocs
	}, [observations, tracks])

	const handleViewExchange = React.useCallback(() => {
		console.log('Clicking on view exchange (TODO in future)')
		// navigate({ to: '/exchange' })

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [navigate])

	const handleViewTeam = React.useCallback(() => {
		console.log('Clicking on team (TODO in future)')
		// navigate({ to: '/team' })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [navigate])

	const handleSelectObservation = (obsId: string) => {
		console.log('Clicking on view observation (TODO in future)', obsId)
		// navigate({
		// 	to: '/view-observation',
		// 	params: { observationId: obsId },
		// })
	}

	const handleSelectTrack = React.useCallback(
		(trackId: string) => {
			console.log('Clicking on view track (TODO in future)', trackId)
			// 	navigate({
			// 		to: '/view-track',
			// 		params: { trackId },
			// 	})
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[navigate],
	)

	const handleEditProjectName = () => {
		console.log('Edit project name clicked (TODO in future).')
	}

	if (isRefetchingTracks || isRefetchingObs) {
		return <div>{formatMessage(m.loading)}</div>
	}

	if (obsError || trackError || settingsError) {
		return <div>{formatMessage(m.errorLoading)}</div>
	}

	const projectName = projectSettings?.name || formatMessage(m.unnamedProject)

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				gap: 18,
				paddingTop: 20,
			}}
		>
			<ProjectHeader projectName={projectName} onEdit={handleEditProjectName} />
			{!combinedData.length ? (
				<EmptyState />
			) : (
				<ObservationListView
					projectName={projectName}
					combinedData={combinedData}
					onViewExchange={handleViewExchange}
					onViewTeam={handleViewTeam}
					onSelectObservation={handleSelectObservation}
					onSelectTrack={handleSelectTrack}
					onEditProjectName={handleEditProjectName}
				/>
			)}
		</div>
	)
}
