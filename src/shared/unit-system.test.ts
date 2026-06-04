import { is } from 'valibot'
import { describe, expect, test } from 'vitest'

import { UnitSystemSchema } from './unit-system.ts'

describe('UnitSystemSchema', () => {
	test('captures valid values', () => {
		expect(is(UnitSystemSchema, 'metric')).toBe(true)
		expect(is(UnitSystemSchema, 'imperial')).toBe(true)
	})

	test('denies invalid values', () => {
		expect(is(UnitSystemSchema, '')).toBe(false)
		expect(is(UnitSystemSchema, 0)).toBe(false)
		expect(is(UnitSystemSchema, null)).toBe(false)
		expect(is(UnitSystemSchema, undefined)).toBe(false)
		expect(is(UnitSystemSchema, {})).toBe(false)
		expect(is(UnitSystemSchema, [])).toBe(false)
	})
})
