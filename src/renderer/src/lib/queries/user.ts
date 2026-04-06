import {
	mutationOptions,
	queryOptions,
	type UseMutationOptions,
} from '@tanstack/react-query'

import type { RuntimeApi } from '../../../../preload/runtime.ts'

const BASE_QUERY_KEY = 'user'

export function getOnboardedAtQueryOptions() {
	return queryOptions({
		queryKey: [BASE_QUERY_KEY, 'onboardedAt'] as const,
		queryFn: async () => {
			return window.runtime.getOnboardedAt()
		},
	})
}

export function setOnboardedAtMutationOptions() {
	return mutationOptions({
		mutationFn: async (vars) => {
			return window.runtime.setOnboardedAt(vars)
		},
		onSuccess: (_data, _variables, _onMutateResult, context) => {
			context.client.invalidateQueries({
				queryKey: getOnboardedAtQueryOptions().queryKey,
			})
		},
	} satisfies UseMutationOptions<
		void,
		Error,
		Parameters<RuntimeApi['setOnboardedAt']>[0]
	>)
}
