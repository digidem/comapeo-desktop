import { useAcceptInvite, useRejectInvite } from '@comapeo/core-react'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

export const ONBOARDING_ACCEPT_INVITE_MUTATION_KEY = [
	'invites',
	'accept',
] as const

export const ONBOARDING_REJECT_INVITE_MUTATION_KEY = [
	'invites',
	'reject',
] as const

export function useOnboardingAcceptInvite(
	opts?: UseMutationOptions<string, Error, { inviteId: string }>,
) {
	const { mutateAsync } = useAcceptInvite()

	return useMutation({
		...opts,
		mutationKey: ONBOARDING_ACCEPT_INVITE_MUTATION_KEY,
		mutationFn: async ({ inviteId }: { inviteId: string }) => {
			return mutateAsync({ inviteId })
		},
	})
}

export function useOnboardingRejectInvite(
	opts?: UseMutationOptions<void, Error, { inviteId: string }>,
) {
	const { mutateAsync } = useRejectInvite()

	return useMutation({
		...opts,
		mutationKey: ONBOARDING_REJECT_INVITE_MUTATION_KEY,
		mutationFn: async ({ inviteId }: { inviteId: string }) => {
			return mutateAsync({ inviteId })
		},
	})
}
