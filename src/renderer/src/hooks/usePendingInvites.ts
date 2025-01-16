import { useEffect } from 'react'
import { getPendingInvitesQueryKey, useClientApi } from '@comapeo/core-react'
import type { Invite } from '@comapeo/core/dist/invite-api'
import { useQuery, useQueryClient } from '@tanstack/react-query'

function dedupeInvites(invites: Array<Invite>) {
	const existingInvites = new Set<string>()
	return invites.filter((inv) => {
		if (existingInvites.has(inv.inviteId)) return false
		existingInvites.add(inv.inviteId)
		return true
	})
}

export function usePendingInvites() {
	const clientApi = useClientApi()
	const queryClient = useQueryClient()

	const {
		data = [],
		isFetching,
		isLoading,
		error,
	} = useQuery<Array<Invite>>({
		queryKey: getPendingInvitesQueryKey(),
		queryFn: async () => {
			const invites = await clientApi.invite.getPending()
			return dedupeInvites(invites)
		},
	})

	useEffect(() => {
		function onInviteEvent() {
			queryClient.invalidateQueries({ queryKey: getPendingInvitesQueryKey() })
		}

		clientApi.invite.addListener('invite-received', onInviteEvent)
		clientApi.invite.addListener('invite-removed', onInviteEvent)

		return () => {
			clientApi.invite.removeListener('invite-received', onInviteEvent)
			clientApi.invite.removeListener('invite-removed', onInviteEvent)
		}
	}, [clientApi.invite, queryClient])

	return {
		data,
		isFetching,
		isLoading,
		error,
	}
}
