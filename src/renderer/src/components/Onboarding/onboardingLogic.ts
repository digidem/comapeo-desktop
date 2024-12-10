import { INPUT_NAME_MAX_BYTES } from '../../constants'

export function countGraphemes(text: string): number {
	const segmenter = new Intl.Segmenter(undefined, {
		granularity: 'grapheme',
	})
	let result = 0
	for (const _ of segmenter.segment(text)) result++
	return result
}

export function getUtf8ByteLength(text: string): number {
	return new TextEncoder().encode(text).length
}

export function checkForError(value: string, maxGraphemes: number): boolean {
	if (value.length === 0) {
		return true
	}
	const graphemes = countGraphemes(value)
	const byteLength = getUtf8ByteLength(value)

	if (graphemes > maxGraphemes || byteLength > INPUT_NAME_MAX_BYTES) {
		return true
	}

	return false
}
