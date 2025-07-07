import {
	queryOptions,
	type QueryClient,
	type UseMutationOptions,
} from '@tanstack/react-query'

const DIAGNOSTICS_QUERY_KEY = ['diagnostics'] as const

export function diagnosticsEnabledQueryOptions() {
	return queryOptions({
		queryKey: DIAGNOSTICS_QUERY_KEY,
		queryFn: async () => {
			return window.runtime.getDiagnosticsEnabled()
		},
	})
}

export function diagnosticsEnabledMutationOptions({
	queryClient,
}: {
	queryClient: QueryClient
}) {
	return {
		mutationFn: async (enable: boolean) => {
			return window.runtime.setDiagnosticsEnabled(enable)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: DIAGNOSTICS_QUERY_KEY,
			})
		},
	} satisfies UseMutationOptions<void, Error, boolean>
}
