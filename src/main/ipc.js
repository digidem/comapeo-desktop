import * as v from 'valibot'

const FilesSelectParamsSchema = v.union([
	v.object({ extensionFilters: v.optional(v.array(v.string())) }),
	v.undefined(),
])

export const APP_IPC_EVENT_TO_PARAMS_PARSER = /** @type {const} */ ({
	/**
	 * @param {unknown} value
	 *
	 * @returns {import('valibot').InferOutput<typeof FilesSelectParamsSchema>}
	 */
	'files:select': (value) => {
		return v.parse(FilesSelectParamsSchema, value)
	},
})

/** @typedef {keyof typeof APP_IPC_EVENT_TO_PARAMS_PARSER} AppIPCEvents */
