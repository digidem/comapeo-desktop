import * as v from 'valibot'

export type SelectedFile = {
	name: string
	path: string
}

export const FilesSelectParamsSchema = v.union([
	v.object({ extensionFilters: v.optional(v.array(v.string())) }),
	v.undefined(),
])

export const ImportSMPFileParamsSchema = v.object({
	filePath: v.string(),
})

export type FilesSelectParams = v.InferInput<typeof FilesSelectParamsSchema>

export const DownloadURLParamsSchema = v.object({
	url: v.pipe(v.string(), v.url()),
	saveAs: v.boolean(),
})
