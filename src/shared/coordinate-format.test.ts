import { is } from 'valibot'
import { describe, expect, test } from 'vitest'

import { CoordinateFormatSchema } from './coordinate-format.js'

describe('CoordinateFormatSchema', () => {
	test('captures valid values', () => {
		expect(is(CoordinateFormatSchema, 'dms')).toBe(true)
		expect(is(CoordinateFormatSchema, 'dd')).toBe(true)
		expect(is(CoordinateFormatSchema, 'utm')).toBe(true)
	})

	test('denies invalid values', () => {
		expect(is(CoordinateFormatSchema, '')).toBe(false)
		expect(is(CoordinateFormatSchema, 0)).toBe(false)
		expect(is(CoordinateFormatSchema, null)).toBe(false)
		expect(is(CoordinateFormatSchema, undefined)).toBe(false)
		expect(is(CoordinateFormatSchema, {})).toBe(false)
		expect(is(CoordinateFormatSchema, [])).toBe(false)
	})
})
