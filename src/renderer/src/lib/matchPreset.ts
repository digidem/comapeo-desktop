import type { Observation, Preset } from '@comapeo/schema'

export function matchPreset(
	observationTags: Observation['tags'],
	presets: Array<Preset>,
): Preset | undefined {
	let best: Preset | undefined
	let bestMatchCount = 0

	for (const p of presets) {
		const presetTags = p.tags || {}
		let matchCount = 0
		let allRequiredTagsMatch = true
		for (const [key, val] of Object.entries(presetTags)) {
			if (observationTags[key] === val) {
				matchCount++
			} else {
				allRequiredTagsMatch = false
				break
			}
		}
		if (allRequiredTagsMatch && matchCount > bestMatchCount) {
			best = p
			bestMatchCount = matchCount
		}
	}
	return best
}
