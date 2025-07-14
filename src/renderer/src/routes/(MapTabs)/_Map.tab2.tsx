import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Button } from '../../components/Button'
import { Text } from '../../components/Text'
import { useCreateTestObservations } from '../../hooks/mutations/useCreateTestObservations'
import { getAppSettingQueryOptions } from '../../lib/queries/app-settings'

export const Route = createFileRoute('/(MapTabs)/_Map/tab2')({
	component: Settings,
})

export function Settings() {
	const { mutate: createTestData, isPending } = useCreateTestObservations()

	const { data: projectId } = useSuspenseQuery(
		getAppSettingQueryOptions('activeProjectId'),
	)
	const navigate = useNavigate()

	function handleCreateTestData() {
		if (!projectId) {
			console.error('No active project selected. Cannot create test data.')
			return
		}
		createTestData(
			{ projectId: projectId, count: 20 },
			{
				onSuccess: () => {
					navigate({ to: '/main' })
				},
				onError: (err) => {
					console.error('Error creating test data', err)
				},
			},
		)
	}

	return (
		<div style={{ padding: 16 }}>
			<Text kind="title" style={{ marginBottom: 8 }}>
				Settings
			</Text>
			<Button onClick={handleCreateTestData} disabled={isPending}>
				{isPending ? 'Creating...' : 'Create 20 Test Observations'}
			</Button>
		</div>
	)
}
