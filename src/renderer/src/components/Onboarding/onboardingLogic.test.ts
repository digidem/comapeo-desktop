import { describe, expect, it } from 'vitest'

import { INPUT_NAME_MAX_BYTES } from '../../constants'
import {
	checkForError,
	countGraphemes,
	getUtf8ByteLength,
} from './onboardingLogic'

describe('onboardingLogic', () => {
	describe('countGraphemes', () => {
		it('counts simple ASCII characters correctly', () => {
			expect(countGraphemes('Awana')).toBe(5)
			expect(countGraphemes('')).toBe(0)
		})

		it('counts graphemes with combined Unicode characters', () => {
			const complexEmoji = '👩🏾‍🌾'
			expect(countGraphemes(complexEmoji)).toBe(1)

			const japaneseChar = 'あ'
			expect(countGraphemes(japaneseChar)).toBe(1)
		})
	})

	describe('getUtf8ByteLength', () => {
		it('returns the correct length for ASCII strings', () => {
			expect(getUtf8ByteLength('Awana')).toBe(5)
			expect(getUtf8ByteLength('')).toBe(0)
		})

		it('returns the correct length for Unicode strings', () => {
			const familyEmoji = '👨‍👩‍👧‍👦'
			expect(getUtf8ByteLength(familyEmoji)).toBe(25)

			const accentedChar = 'é'
			expect(getUtf8ByteLength(accentedChar)).toBe(2)
		})
	})

	describe('checkForError', () => {
		it('returns true for empty input', () => {
			expect(checkForError('', 10)).toBe(true)
		})

		it('returns false for input within grapheme and byte limits with ASCII strings', () => {
			const input = 'Awana'
			expect(checkForError(input, 10)).toBe(false)
		})

		it('returns false for input within grapheme and byte limits with unicode strings', () => {
			const input = '👻👻👩‍👩‍👦‍👦👻👩‍👩‍👦‍👦👻👩‍👩‍👦‍👦👻👩‍👩‍👦‍👦👻'
			expect(checkForError(input, 10)).toBe(false)
		})

		it('returns true if grapheme limit is exceeded with ASCII strings', () => {
			const input = 'AwanaAwanaA'
			expect(checkForError(input, 10)).toBe(true)
		})

		it('returns true if grapheme limit is exceeded with unicode strings', () => {
			const input = '👻👩‍👩‍👦‍👦👻👩‍👩‍👦‍👦👻👩‍👩‍👦‍👦👻👩‍👩‍👦‍👦👻👩‍👩‍👦‍👦👻'
			expect(checkForError(input, 10)).toBe(true)
		})

		it('returns true if UTF-8 byte length exceeds INPUT_NAME_MAX_BYTES even if does not exceed grapheme count', () => {
			const longString = 'A'.repeat(INPUT_NAME_MAX_BYTES + 1)
			expect(checkForError(longString, 10000)).toBe(true)
		})
	})
})
