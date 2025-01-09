import * as React from 'react'
import { useProjectSettings } from '@comapeo/core-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { EmptyState } from '../../components/Observations/EmptyState'
import { ObservationListView } from '../../components/Observations/ObservationListView'
import { useActiveProjectIdStoreState } from '../../contexts/ActiveProjectIdProvider'
import { useAllObservations } from '../../hooks/useObservations.ts'

export const Route = createFileRoute('/(MapTabs)/_Map/main')({
	component: MainScreen,
})

export function MainScreen() {
	const navigate = useNavigate()
	const activeProjectId = useActiveProjectIdStoreState((s) => s.activeProjectId)
	const { data: projectSettings, error: settingsError } = useProjectSettings({
		projectId: activeProjectId || '',
	})

	const {
		data: obsDocs,
		error: obsError,
		isRefetching,
	} = useAllObservations(activeProjectId)

	const handleViewExchange = React.useCallback(() => {
		navigate({ to: '/exchange' })
	}, [navigate])

	const handleViewTeam = React.useCallback(() => {
		navigate({ to: '/team' })
	}, [navigate])

	const handleSelectObservation = (obsId: string) => {
		navigate({
			to: '/view-observation',
			params: { observationId: obsId },
		})
	}

	if (isRefetching) {
		return <div>Loading...</div>
	}

	if (obsError || settingsError) {
		return <div>Oops! Error loading data.</div>
	}

	const projectName = projectSettings?.name ?? 'Unnamed Project'

	if (!obsDocs || obsDocs.length === 0) {
		return <EmptyState projectName={projectName} />
	}
	return (
		<ObservationListView
			projectName={projectName}
			observations={obsDocs}
			onViewExchange={handleViewExchange}
			onViewTeam={handleViewTeam}
			onSelectObservation={handleSelectObservation}
		/>
	)
}
