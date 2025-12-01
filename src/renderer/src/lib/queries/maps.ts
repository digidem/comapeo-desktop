import { queryOptions, type UseMutationOptions } from '@tanstack/react-query'
import * as v from 'valibot'

import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../comapeo'

// NOTE: Copied from https://github.com/digidem/comapeo-core-react/blob/6bec9e938ba74ef1d8ada8110fbab51b44f3c692/src/lib/react-query/maps.ts#L7
const MAPS_BASE_QUERY_KEY = [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'maps'] as const

const CustomMapInfoSchema = v.object({
	created: v.pipe(v.string(), v.isoTimestamp(), v.toDate()),
	name: v.string(),
	size: v.pipe(v.number(), v.minValue(0)),
})

export function getCustomMapInfoQueryOptions({
	styleUrl,
}: {
	styleUrl: string
}) {
	return queryOptions({
		queryKey: [...MAPS_BASE_QUERY_KEY, 'custom', 'info', { styleUrl }] as const,
		/**
		 * @returns Resolves with `null` if no viable map is found. Rejects if a
		 *   detected map is invalid.
		 */
		queryFn: async () => {
			const response = await fetch(
				// NOTE: Subject to change if the maps plugin implementation in core ever changes
				// https://github.com/digidem/comapeo-core/blob/403889378b00308ecba25fb05d5a80c5f2df4451/src/fastify-plugins/maps.js#L33-L82
				new URL('/maps/custom/info', styleUrl).href,
			)

			if (response.status === 404) {
				return null
			}

			if (!response.ok) {
				throw new Error(`Cannot get custom map info: ${response.statusText}`)
			}

			return v.parse(CustomMapInfoSchema, await response.json())
		},
	})
}

export function importSMPFileMutationOptions(): UseMutationOptions<
	void,
	Error,
	{ filePath: string }
> {
	return {
		mutationFn: async (opts) => {
			return window.runtime.importSMPFile(opts.filePath)
		},
		onSuccess: (_data, _variables, _mutateResult, context) => {
			context.client.invalidateQueries({ queryKey: MAPS_BASE_QUERY_KEY })
		},
	}
}

export function removeSMPFileMutationOptions(): UseMutationOptions<
	void,
	Error,
	undefined
> {
	return {
		mutationFn: async () => {
			return window.runtime.removeSMPFile()
		},
		onSuccess: (_data, _variables, _mutateResult, context) => {
			context.client.invalidateQueries({ queryKey: MAPS_BASE_QUERY_KEY })
		},
	}
}
