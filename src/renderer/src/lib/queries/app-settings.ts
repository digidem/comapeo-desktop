import {
	QueryClient,
	queryOptions,
	type UseMutationOptions,
} from '@tanstack/react-query'

import type { EditableAppSettings } from '../../../../main/config-store'

const BASE_QUERY_KEY = 'app-settings'

export function getAppSettingQueryKey(name: keyof EditableAppSettings) {
	return [BASE_QUERY_KEY, name] as const
}

export function getAppSettingQueryOptions<
	Name extends keyof EditableAppSettings,
>(name: Name) {
	return queryOptions({
		queryKey: [BASE_QUERY_KEY, name],
		queryFn: async () => {
			return window.runtime.getSetting(name)
		},
	})
}

export function setAppSettingMutationOptions<
	N extends keyof EditableAppSettings,
>({ name, queryClient }: { name: N; queryClient: QueryClient }) {
	return {
		mutationFn: async (vars) => {
			return window.runtime.setSetting(name, vars)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getAppSettingQueryKey(name) })
		},
	} satisfies UseMutationOptions<void, Error, EditableAppSettings[N]>
}
