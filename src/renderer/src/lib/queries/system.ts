import { queryOptions, type UseMutationOptions } from '@tanstack/react-query'

import type { RuntimeApi } from '../../../../preload/runtime'

const BASE_QUERY_KEY = 'system'

export function getWifiConnectionsOptions() {
	return queryOptions({
		queryKey: [BASE_QUERY_KEY, 'network', 'wifiConnections'] as const,
		queryFn: async () => {
			return window.runtime.getWifiConnections()
		},
	})
}

export function openExternalURLMutationOptions() {
	return {
		mutationFn: async (vars) => {
			return window.runtime.openExternalURL(vars)
		},
	} satisfies UseMutationOptions<
		void,
		Error,
		Parameters<RuntimeApi['openExternalURL']>[0]
	>
}
