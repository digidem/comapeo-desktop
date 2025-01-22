import type { Observation, Preset } from '@comapeo/schema'

export function matchPreset(
	availableTags: Observation['tags'],
	presets: Array<Preset>,
): Preset | undefined {
	let bestMatch: Preset | undefined
	let bestMatchScore = 0

	presets.forEach((preset) => {
		let score = 0
		const presetTagsCount = Object.keys(preset.tags).length

		for (const key in preset.tags) {
			if (Object.prototype.hasOwnProperty.call(preset.tags, key)) {
				const presetTag = preset.tags[key]
				const availableTag = availableTags[key]
				if (presetTag === availableTag) {
					score++
				} else if (
					Array.isArray(presetTag) &&
					presetTag.includes(availableTag as boolean | number | string | null)
				) {
					score++
				}
			}
		}

		score = (score / presetTagsCount) * 100
		if (score > bestMatchScore) {
			bestMatchScore = score
			bestMatch = preset
		}
	})

	return bestMatch
}
