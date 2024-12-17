import { pendingInvitesQueryOptions, useClientApi } from '@comapeo/core-react'
import { useSuspenseQuery } from '@tanstack/react-query'

export function usePendingInvites() {
	const clientApi = useClientApi()
	return useSuspenseQuery({
		...pendingInvitesQueryOptions({ clientApi }),
	})
}
