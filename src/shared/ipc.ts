import type {
	MIGRATION_REASON_NO_SPACE,
	MigrationReason,
	NeedsSpace,
} from '@comapeo/core/migration.js'
import * as v from 'valibot'

export type SelectedFile = {
	name: string
	path: string
}

export const FilesSelectFileParamsSchema = v.union([
	v.object({
		actionLabel: v.optional(v.string()),
		extensionFilters: v.optional(v.array(v.string())),
	}),
	v.undefined(),
])

export const FilesSelectDirectoryParamsSchema = v.union([
	v.object({
		actionLabel: v.optional(v.string()),
	}),
	v.undefined(),
])

export const ImportSMPFileParamsSchema = v.object({
	filePath: v.string(),
})

export type FilesSelectFileParams = v.InferInput<
	typeof FilesSelectFileParamsSchema
>

export const DownloadURLParamsSchema = v.object({
	url: v.pipe(v.string(), v.url()),
	saveAs: v.boolean(),
})

export type MigrationStatus =
	| { type: 'progress'; current: number; total: number }
	| { type: 'error'; error: Error }
	| { type: 'error:needs_space'; spaceNeeded: number }
	| { type: 'done' }
