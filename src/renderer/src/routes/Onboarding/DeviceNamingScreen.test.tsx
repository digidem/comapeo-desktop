import { expect, test, vi } from 'vitest'

import { getUtf8ByteLength } from './DeviceNamingScreen'

vi.mock('@comapeo/core-react', () => ({}))

test('should return the correct byte length for ASCII characters', () => {
	const text = 'hello'
	const result = getUtf8ByteLength(text)
	expect(result).toBe(5) // Each ASCII character is 1 byte
})
