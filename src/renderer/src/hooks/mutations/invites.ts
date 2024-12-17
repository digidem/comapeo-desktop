import {
	getInvitesQueryKey,
	getPendingInvitesQueryKey,
	useClientApi,
} from '@comapeo/core-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useAcceptInvite() {
	const clientApi = useClientApi()
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ inviteId }: { inviteId: string }) => {
			return clientApi.invite.accept({ inviteId })
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getPendingInvitesQueryKey() })
			queryClient.invalidateQueries({ queryKey: getInvitesQueryKey() })
		},
	})
}

export function useRejectInvite() {
	const clientApi = useClientApi()
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ inviteId }: { inviteId: string }) => {
			return clientApi.invite.reject({ inviteId })
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getPendingInvitesQueryKey() })
			queryClient.invalidateQueries({ queryKey: getInvitesQueryKey() })
		},
	})
}
