import {
	useAcceptInvite,
	useCreateProject,
	useRejectInvite,
} from '@comapeo/core-react'
import { useMutation } from '@tanstack/react-query'

export const ONBOARDING_ACCEPT_INVITE_MUTATION_KEY = [
	'invites',
	'accept',
] as const

export const ONBOARDING_REJECT_INVITE_MUTATION_KEY = [
	'invites',
	'reject',
] as const

export function useOnboardingRejectInvite() {
	const rejectInvite = useRejectInvite()

	return useMutation({
		mutationKey: ONBOARDING_REJECT_INVITE_MUTATION_KEY,
		mutationFn: rejectInvite.mutateAsync,
	})
}

export function useOnboardingAcceptInvite() {
	const acceptInvite = useAcceptInvite()

	return useMutation({
		mutationKey: ONBOARDING_ACCEPT_INVITE_MUTATION_KEY,
		mutationFn: acceptInvite.mutateAsync,
	})
}

export const ONBOARDING_CREATE_PROJECT_MUTATION_KEY = [
	'projects',
	'create',
] as const

export function useOnboardingCreateProject() {
	const { mutateAsync } = useCreateProject()

	return useMutation({
		mutationKey: ONBOARDING_CREATE_PROJECT_MUTATION_KEY,
		mutationFn: async ({
			name,
			configPath,
		}: {
			name?: string
			configPath?: string
		}) => {
			return mutateAsync({ name, configPath })
		},
	})
}
