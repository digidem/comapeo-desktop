import * as v from 'valibot'

import {
	DEVICE_NAME_MAX_LENGTH_GRAPHEMES,
	INPUT_NAME_MAX_BYTES,
} from '../constants'

export function createDeviceNameSchema(opts?: {
	maxBytesError?: string
	maxLengthError?: string
	minLengthError?: string
}) {
	return v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, opts?.minLengthError),
		v.maxGraphemes(DEVICE_NAME_MAX_LENGTH_GRAPHEMES, opts?.maxLengthError),
		v.maxBytes(INPUT_NAME_MAX_BYTES, opts?.maxBytesError),
	)
}
