import {
	array,
	object,
	optional,
	parse,
	string,
	undefined,
	union,
} from 'valibot'

const FilesSelectParamsSchema = union([
	object({
		extensionFilters: optional(array(string())),
	}),
	undefined(),
])

export const APP_IPC_EVENT_TO_PARAMS_PARSER = /** @type {const} */ ({
	/**
	 * @param {unknown} value
	 *
	 * @returns {import('valibot').InferOutput<typeof FilesSelectParamsSchema>}
	 */
	'files:select': (value) => {
		return parse(FilesSelectParamsSchema, value)
	},
})

/** @typedef {keyof typeof APP_IPC_EVENT_TO_PARAMS_PARSER} AppIPCEvents */
