import { expect, test } from 'vitest'

import { getUtf8ByteLength } from './DeviceNamingScreen'

test('should return the correct byte length for ASCII characters', () => {
	const text = 'hello'
	const result = getUtf8ByteLength(text)
	expect(result).toBe(5) // Each ASCII character is 1 byte
})
