import type { Field } from '@comapeo/core/schema.js'
import { defineMessages, type IntlShape } from 'react-intl'
import * as v from 'valibot'

import type { TagValue } from '../../../../../../../lib/comapeo.ts'

export type EditableTextField = Field & {
	type: 'text'
}

export type EditableNumberField = Field & {
	type: 'number'
}

export type EditableSingleSelectField = Field & {
	type: 'selectOne'
	options: NonNullable<Field['options']>
}

export type EditableMultiSelectField = Field & {
	type: 'selectMultiple'
	options: NonNullable<Field['options']>
}

export type EditableDateField = Field & {
	type: 'date'
}

export type EditableField =
	| EditableTextField
	| EditableNumberField
	| EditableSingleSelectField
	| EditableMultiSelectField
	| EditableDateField

export function getDisplayedTagValue({
	tagValue,
	selectionOptions,
	intl,
}: {
	tagValue: TagValue
	intl: Pick<IntlShape, 'formatDate' | 'formatMessage'>
	selectionOptions?: NonNullable<Field['options']>
}): string {
	return (
		(Array.isArray(tagValue) ? tagValue : [tagValue])
			// Only keep string answers with a meaningful value i.e. no `''` (can happen if an answer is deleted by the user) or whitespace-only strings.
			.filter((value) => {
				if (typeof value === 'string' && value.trim().length === 0) {
					return false
				}

				return true
			})
			.map((value) => {
				if (selectionOptions) {
					const matchingLabel = selectionOptions.find(
						(o) => o.value === value,
					)?.label

					if (matchingLabel) {
						return matchingLabel
					}
				}
				if (value === null) {
					return intl.formatMessage(m.fieldAnswerNull)
				}

				if (typeof value === 'boolean') {
					return intl.formatMessage(
						value ? m.fieldAnswerTrue : m.fieldAnswerFalse,
					)
				}

				return value
			})
			.join(', ')
	)
}

export const IsoTimestampSchema = v.pipe(v.string(), v.isoTimestamp())

const m = defineMessages({
	fieldAnswerTrue: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.-shared.fieldAnswerTrue',
		defaultMessage: 'TRUE',
		description: 'Text displayed if a boolean field is answered with "true"',
	},
	fieldAnswerFalse: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.-shared.fieldAnswerFalse',
		defaultMessage: 'FALSE',
		description: 'Text displayed if a boolean field is answered with "false"',
	},
	fieldAnswerNull: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.-shared.fieldAnswerNull',
		defaultMessage: 'NULL',
		description: 'Text displayed if a field is answered with "null"',
	},
})
