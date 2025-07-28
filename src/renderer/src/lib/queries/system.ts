import { queryOptions } from '@tanstack/react-query'

const BASE_QUERY_KEY = 'system'

export function getWifiConnectionsOptions() {
	return queryOptions({
		queryKey: [BASE_QUERY_KEY, 'network', 'wifiConnections'] as const,
		queryFn: async () => {
			return window.runtime.getWifiConnections()
		},
	})
}
