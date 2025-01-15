import * as React from 'react'
import { useManyDocs, useProjectSettings } from '@comapeo/core-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { EmptyState } from '../../components/Observations/EmptyState'
import { ObservationListView } from '../../components/Observations/ObservationListView'
import { useActiveProjectIdStoreState } from '../../contexts/ActiveProjectIdProvider'

const m = defineMessages({
	loading: {
		id: 'mapMain.loading',
		defaultMessage: 'Loading...',
	},
	errorLoading: {
		id: 'mapMain.errorLoading',
		defaultMessage: 'Oops! Error loading data.',
	},
})

export const Route = createFileRoute('/(MapTabs)/_Map/main')({
	component: MainScreen,
})

export function MainScreen() {
	const navigate = useNavigate()
	const { formatMessage, locale } = useIntl()
	const activeProjectId = useActiveProjectIdStoreState((s) => s.activeProjectId)
	const { data: projectSettings, error: settingsError } = useProjectSettings({
		projectId: activeProjectId || '',
	})

	const {
		data: obsDocs,
		error: obsError,
		isRefetching,
	} = useManyDocs({
		projectId: activeProjectId || '',
		docType: 'observation',
		includeDeleted: false,
		lang: locale,
	})

	const handleViewExchange = React.useCallback(() => {
		console.log('Clicking on view exchange (TODO in future)')
		// navigate({ to: '/exchange' })
	}, [navigate])

	const handleViewTeam = React.useCallback(() => {
		console.log('Clicking on team (TODO in future)')
		// navigate({ to: '/team' })
	}, [navigate])

	const handleSelectObservation = (obsId: string) => {
		console.log('Clicking on view observation (TODO in future)')
		// navigate({
		// 	to: '/view-observation',
		// 	params: { observationId: obsId },
		// })
	}

	const handleSelectTrack = React.useCallback(
		(trackId: string) => {
			console.log('Clicking on view track (TODO in future)')
			// 	navigate({
			// 		to: '/view-track',
			// 		params: { trackId },
			// 	})
		},
		[navigate],
	)

	const handleEditProjectName = () => {
		console.log('Edit project name clicked (TODO in future).')
	}

	if (isRefetching) {
		return <div>{formatMessage(m.loading)}</div>
	}

	if (obsError || settingsError) {
		return <div>{formatMessage(m.errorLoading)}</div>
	}

	const projectName = projectSettings?.name

	if (!obsDocs || obsDocs.length === 0) {
		return <EmptyState projectName={projectName} />
	}
	return (
		<ObservationListView
			projectName={projectName}
			projectId={activeProjectId}
			observations={obsDocs}
			onViewExchange={handleViewExchange}
			onViewTeam={handleViewTeam}
			onSelectObservation={handleSelectObservation}
			onSelectTrack={handleSelectTrack}
			onEditProjectName={handleEditProjectName}
		/>
	)
}
