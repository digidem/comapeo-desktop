import * as v from 'valibot'

export const HighlightedDocumentSchema = v.object({
	type: v.union([v.literal('observation'), v.literal('track')]),
	docId: v.string(),
	from: v.union([v.literal('map'), v.literal('list')]),
})

export type HighlightedDocument = v.InferInput<typeof HighlightedDocumentSchema>
