import * as v from 'valibot'

import {
	INPUT_NAME_MAX_BYTES,
	PROJECT_DESCRIPTION_MAX_LENGTH_GRAPHEMES,
	PROJECT_NAME_MAX_LENGTH_GRAPHEMES,
} from '../constants'

export function createProjectNameSchema(opts?: {
	maxBytesError?: string
	maxLengthError?: string
	minLengthError?: string
}) {
	return v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, opts?.minLengthError),
		v.maxGraphemes(PROJECT_NAME_MAX_LENGTH_GRAPHEMES, opts?.maxLengthError),
		v.maxBytes(INPUT_NAME_MAX_BYTES, opts?.maxBytesError),
	)
}

export function createProjectDescriptionSchema(opts?: {
	maxBytesError?: string
	maxLengthError?: string
	minLengthError?: string
}) {
	return v.pipe(
		v.string(),
		v.trim(),
		v.maxGraphemes(
			PROJECT_DESCRIPTION_MAX_LENGTH_GRAPHEMES,
			opts?.maxLengthError,
		),
		v.maxBytes(INPUT_NAME_MAX_BYTES, opts?.maxBytesError),
	)
}

export function createProjectColorSchema(opts?: { colorFormatError?: string }) {
	return v.pipe(v.string(), v.hexColor(opts?.colorFormatError))
}
