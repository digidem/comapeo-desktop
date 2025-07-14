import { defineMessages, type IntlShape } from 'react-intl'
import * as v from 'valibot'

import {
	DEVICE_NAME_MAX_LENGTH_GRAPHEMES,
	INPUT_NAME_MAX_BYTES,
} from '../constants'

export function createDeviceNameSchema({
	formatMessage,
}: {
	formatMessage: IntlShape['formatMessage']
}) {
	return v.pipe(
		v.string(),
		v.transform((value) => {
			return value.trim()
		}),
		v.minLength(1, formatMessage(m.minLengthError)),
		v.maxGraphemes(
			DEVICE_NAME_MAX_LENGTH_GRAPHEMES,
			formatMessage(m.maxLengthError),
		),
		v.maxBytes(INPUT_NAME_MAX_BYTES, formatMessage(m.maxLengthError)),
	)
}

const m = defineMessages({
	minLengthError: {
		id: 'lib.schemas.device-name.minLengthError',
		defaultMessage: 'Enter a Device Name',
		description: 'Error message for device name that is too short.',
	},
	maxLengthError: {
		id: 'lib.schemas.device-name.maxLengthError',
		defaultMessage: 'Too long, try a shorter name.',
		description: 'Error message for device name that is too long.',
	},
})
