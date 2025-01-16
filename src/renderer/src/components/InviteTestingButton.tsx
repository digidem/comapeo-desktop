import { getPendingInvitesQueryKey } from '@comapeo/core-react'
import type { Invite } from '@comapeo/core/dist/invite-api'
import { useQueryClient } from '@tanstack/react-query'

export function InviteTestingButton() {
	const queryClient = useQueryClient()

	function simulateInvite() {
		const mockInvite: Invite = {
			inviteId: 'dev-invite-id',
			projectInviteId: 'mock-project-invite-id',
			projectName: 'Dev Testing Project',
			invitorName: 'Dev Tester',
			receivedAt: Date.now(),
		}

		const key = getPendingInvitesQueryKey()
		const existing = queryClient.getQueryData<Array<Invite>>(key) || []

		const updated = [...existing, mockInvite]

		queryClient.setQueryData(key, updated)
	}

	return (
		<button
			type="button"
			onClick={simulateInvite}
			style={{
				position: 'fixed',
				bottom: 10,
				right: 10,
				zIndex: 9999,
				padding: '8px 12px',
			}}
		>
			Simulate Invite
		</button>
	)
}
