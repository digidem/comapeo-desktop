import * as v from 'valibot'

type LocalStorageKey =
	| 'comapeo:filters:categories'
	| 'comapeo:filters:date'
	| 'comapeo:use_active_project_id_for_initial_route'

export const DateFilterSchema = v.variant('type', [
	v.object({
		type: v.literal('range'),
		start: v.pipe(v.string(), v.isoTimestamp()),
		end: v.pipe(v.string(), v.isoTimestamp()),
	}),
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
	'comapeo:filters:categories': {
		deserialize: v.pipe(v.string(), v.parseJson(), v.array(v.string())),
		serialize: v.pipe(v.array(v.string()), v.stringifyJson()),
	},
	'comapeo:filters:date': {
		deserialize: v.pipe(v.string(), v.parseJson(), DateFilterSchema),
		serialize: v.pipe(DateFilterSchema, v.stringifyJson()),
	},
	'comapeo:use_active_project_id_for_initial_route': {
		deserialize: v.string(),
		serialize: v.string(),
	},
} as const satisfies {
	[K in LocalStorageKey]: {
		deserialize: v.GenericSchema
		serialize: v.GenericSchema
	}
}

type KeyToSerializedValueMapping = {
	[key in LocalStorageKey]: v.InferInput<
		(typeof CodecMappings)[key]['serialize']
	>
}

type KeyToDeserializedValueMapping = {
	[key in LocalStorageKey]: v.InferOutput<
		(typeof CodecMappings)[key]['deserialize']
	>
}

export function setItem<K extends LocalStorageKey>(
	key: K,
	value: KeyToSerializedValueMapping[K],
) {
	const serialized = v.parse(CodecMappings[key]['serialize'], value)

	localStorage.setItem(key, serialized)
}

export function removeItem(key: keyof typeof CodecMappings) {
	localStorage.removeItem(key)
}

export function getItem<K extends LocalStorageKey>(
	key: K,
): KeyToDeserializedValueMapping[K] | null {
	const raw = localStorage.getItem(key)

	if (raw === null) {
		return raw
	}

	// @ts-expect-error Not worth fixing
	return v.parse(CodecMappings[key]['deserialize'], raw)
}
