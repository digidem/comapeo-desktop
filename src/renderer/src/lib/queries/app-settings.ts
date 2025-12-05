import { queryOptions, type UseMutationOptions } from '@tanstack/react-query'

import type { RuntimeApi } from '#preload/runtime.ts'

import { BASE_QUERY_KEY as LANGUAGE_BASE_QUERY_KEY } from './intl.ts'

const BASE_QUERY_KEY = 'app-settings'

export function getCoordinateFormatQueryOptions() {
	return queryOptions({
		queryKey: [BASE_QUERY_KEY, 'coordinateFormat'],
		queryFn: async () => {
			return window.runtime.getCoordinateFormat()
		},
	})
}

export function getDiagnosticsEnabledQueryOptions() {
	return queryOptions({
		queryKey: [BASE_QUERY_KEY, 'diagnosticsEnabled'],
		queryFn: async () => {
			return window.runtime.getDiagnosticsEnabled()
		},
	})
}

export function getLocaleStateQueryOptions() {
	return queryOptions({
		queryKey: [BASE_QUERY_KEY, 'locale'],
		queryFn: async () => {
			return window.runtime.getLocaleState()
		},
	})
}

export function setCoordinateFormatMutationOptions() {
	return {
		mutationFn: async (vars) => {
			return window.runtime.setCoordinateFormat(vars)
		},
		onSuccess: (_data, _variables, _mutateResult, context) => {
			context.client.invalidateQueries({
				queryKey: [BASE_QUERY_KEY, 'coordinateFormat'],
			})
		},
	} satisfies UseMutationOptions<
		void,
		Error,
		Parameters<RuntimeApi['setCoordinateFormat']>[0]
	>
}

export function setDiagnosticsEnabledMutationOptions() {
	return {
		mutationFn: async (vars) => {
			return window.runtime.setDiagnosticsEnabled(vars)
		},
		onSuccess: (_data, _variables, _mutateResult, context) => {
			context.client.invalidateQueries({
				queryKey: [BASE_QUERY_KEY, 'diagnosticsEnabled'],
			})
		},
	} satisfies UseMutationOptions<
		void,
		Error,
		Parameters<RuntimeApi['setDiagnosticsEnabled']>[0]
	>
}

export function setLocaleMutationOptions() {
	return {
		mutationFn: async (vars) => {
			return window.runtime.setLocale(vars)
		},
		onSuccess: (_data, _variables, _mutateResult, context) => {
			context.client.invalidateQueries({ queryKey: [BASE_QUERY_KEY, 'locale'] })
			context.client.invalidateQueries({ queryKey: [LANGUAGE_BASE_QUERY_KEY] })
		},
	} satisfies UseMutationOptions<
		void,
		Error,
		Parameters<RuntimeApi['setLocale']>[0]
	>
}
