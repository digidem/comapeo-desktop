import type { Field } from '@comapeo/schema'
import { defineMessages, type IntlShape } from 'react-intl'

import type { TagValue } from '../../../../../../lib/comapeo'

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

export type EditableField =
	| EditableTextField
	| EditableNumberField
	| EditableSingleSelectField
	| EditableMultiSelectField

export function getDisplayedTagValue({
	tagValue,
	selectionOptions,
	formatMessage,
}: {
	tagValue: TagValue
	formatMessage: IntlShape['formatMessage']
	selectionOptions?: NonNullable<Field['options']>
}): string {
	return (
		(Array.isArray(tagValue) ? tagValue : [tagValue])
			// Only keep string answers with a meaningful value i.e. no `''` (can happen if an answer is deleted by the user) or whitespace-only strings.
			.filter((v) => {
				if (typeof v === 'string' && v.trim().length === 0) {
					return false
				}

				return true
			})
			.map((v) => {
				if (selectionOptions) {
					const matchingLabel = selectionOptions.find(
						(o) => o.value === v,
					)?.label

					if (matchingLabel) {
						return matchingLabel
					}
				}
				if (v === null) {
					return formatMessage(m.fieldAnswerNull)
				}

				if (typeof v === 'boolean') {
					return formatMessage(v ? m.fieldAnswerTrue : m.fieldAnswerFalse)
				}

				return v
			})
			.join(', ')
	)
}

const m = defineMessages({
	fieldAnswerTrue: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-shared.fieldAnswerTrue',
		defaultMessage: 'TRUE',
		description: 'Text displayed if a boolean field is answered with "true"',
	},
	fieldAnswerFalse: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-shared.fieldAnswerFalse',
		defaultMessage: 'FALSE',
		description: 'Text displayed if a boolean field is answered with "false"',
	},
	fieldAnswerNull: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.-shared.fieldAnswerNull',
		defaultMessage: 'NULL',
		description: 'Text displayed if a field is answered with "null"',
	},
})
