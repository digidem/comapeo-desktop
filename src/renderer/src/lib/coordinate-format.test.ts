import { describe, expect, it } from 'vitest'

import { convertToUTM } from './coordinate-format'

describe('convertToUTM()', () => {
	it('converts latitude + longitude to UTM format', () => {
		expect(convertToUTM({ lat: 12, lon: -34 })).toBe('UTM 25P 391136 1326751')
	})
})
