import { isBefore } from 'date-fns'
import * as v from 'valibot'

const COMAPEO_KEY_PREFIX = 'comapeo' as const

type ProjectScopedKeyPaths = 'filters/categories' | 'filters/date'

type KeyPaths =
	'use_active_project_id_for_initial_route' | ProjectScopedKeyPaths

export const DateFilterSchema = v.variant('type', [
	v.pipe(
		v.object({
			type: v.literal('range'),
			start: v.pipe(v.string(), v.isoTimestamp()),
			end: v.pipe(v.string(), v.isoTimestamp()),
		}),
		v.check((input) => {
			return isBefore(input.start, input.end)
		}),
	),
	v.object({
		type: v.literal('same'),
		unit: v.union([v.literal('month'), v.literal('year')]),
	}),
	v.object({
		type: v.literal('relative'),
		unit: v.literal('days'),
		value: v.number(),
	}),
])

export type DateFilter = v.InferOutput<typeof DateFilterSchema>

const CodecMappings = {
	'filters/categories': {
		deserialize: v.pipe(v.string(), v.parseJson(), v.array(v.string())),
		serialize: v.pipe(v.array(v.string()), v.stringifyJson()),
	},
	'filters/date': {
		deserialize: v.pipe(v.string(), v.parseJson(), DateFilterSchema),
		serialize: v.pipe(DateFilterSchema, v.stringifyJson()),
	},
	use_active_project_id_for_initial_route: {
		deserialize: v.pipe(
			v.union([v.literal('true'), v.literal('false')]),
			v.transform((input) => {
				return input === 'true'
			}),
		),
		serialize: v.pipe(
			v.boolean(),
			v.transform((input) => {
				return input ? 'true' : 'false'
			}),
		),
	},
} as const satisfies {
	[K in KeyPaths]: {
		deserialize: v.GenericSchema
		serialize: v.GenericSchema
	}
}

type KeyToSerializedValueMapping = {
	[key in KeyPaths]: v.InferInput<(typeof CodecMappings)[key]['serialize']>
}

type KeyToDeserializedValueMapping = {
	[key in KeyPaths]: v.InferOutput<(typeof CodecMappings)[key]['deserialize']>
}

function getLocalStoragePrefix(projectId?: string) {
	const base = `${COMAPEO_KEY_PREFIX}:`

	if (projectId) {
		return base + `${projectId}/`
	}

	return base
}

export function setItem<K extends KeyPaths>(
	...args: K extends ProjectScopedKeyPaths
		? [K, KeyToSerializedValueMapping[K], string]
		: [K, KeyToSerializedValueMapping[K]]
) {
	const [key, value, projectId] = args

	const serialized = v.parse(CodecMappings[key]['serialize'], value)

	localStorage.setItem(getLocalStoragePrefix(projectId) + key, serialized)
}

export function removeItem<K extends KeyPaths>(
	...args: K extends ProjectScopedKeyPaths ? [K, string] : [K]
) {
	const [key, projectId] = args

	localStorage.removeItem(getLocalStoragePrefix(projectId) + key)
}

export function getItem<K extends KeyPaths>(
	...args: K extends ProjectScopedKeyPaths ? [K, string] : [K]
): KeyToDeserializedValueMapping[K] | null {
	const [key, projectId] = args

	const raw = localStorage.getItem(getLocalStoragePrefix(projectId) + key)

	if (raw === null) {
		return raw
	}

	// @ts-expect-error Not worth fixing
	return v.parse(CodecMappings[key]['deserialize'], raw)
}
