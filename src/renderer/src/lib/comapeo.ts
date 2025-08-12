import type { MemberApi } from '@comapeo/core'
import type { Field, Observation, Preset, Track } from '@comapeo/schema'

export type Attachment = Observation['attachments'][number]

// https://github.com/digidem/comapeo-core-react/blob/e56979321e91440ad6e291521a9e3ce8eb91200d/src/lib/react-query/shared.ts#L6C1-L6C52
export const COMAPEO_CORE_REACT_ROOT_QUERY_KEY = '@comapeo/core-react' as const

// TODO: Ideally exported from core
// Copied from https://github.com/digidem/comapeo-core/blob/28438c5e6b798e1e698fb3211874f9fe41c7e317/src/roles.js#L10-L16
export const CREATOR_ROLE_ID = 'a12a6702b93bd7ff'
export const COORDINATOR_ROLE_ID = 'f7c150f5a3a9a855'
export const MEMBER_ROLE_ID = '012fd2d431c0bf60'
export const BLOCKED_ROLE_ID = '9e6d29263cba36c9'
export const LEFT_ROLE_ID = '8ced989b1904606b'
export const FAILED_ROLE_ID = 'a24eaca65ab5d5d0'
export const NO_ROLE_ID = '08e4251e36f6e7ed'

/**
 * Finds the best matching preset based on the tags of an observation. It
 * matches the preset tags to the observation tags, following the id-editors
 * convention. This approach allows for tags to be edited and changed in a
 * preset while still maintaining backwards compatibility when necessary.
 */
function getCategoryUsingTags(
	tags: Observation['tags'] | Track['tags'],
	presets: Array<Preset>,
): Preset | undefined {
	let bestMatch: Preset | undefined
	let bestMatchScore = 0

	presets.forEach((preset) => {
		let score = 0
		const presetTagsCount = Object.keys(preset.tags).length

		for (const key in preset.tags) {
			// eslint-disable-next-line no-prototype-builtins
			if (preset.tags.hasOwnProperty(key)) {
				const presetTag = preset.tags[key]
				const availableTag = tags[key]
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

		// Calculate a score based on how many tags matched
		score = (score / presetTagsCount) * 100

		// Update the best match if the current preset's score is higher
		if (score > bestMatchScore) {
			bestMatchScore = score
			bestMatch = preset
		}
	})

	return bestMatch
}

export function getMatchingCategoryForDocument(
	document: Observation | Track,
	categories: Array<Preset>,
) {
	let result = getCategoryUsingTags(document.tags, categories)

	if (!result && document.presetRef?.docId) {
		result = categories.find((c) => c.docId === document.presetRef?.docId)
	}

	return result
}

export type ActiveRemoteArchiveMemberInfo = MemberApi.MemberInfo & {
	deviceType: 'selfHostedServer'
	selfHostedServerDetails: NonNullable<
		MemberApi.MemberInfo['selfHostedServerDetails']
	>
}

export function memberIsActiveRemoteArchive(
	member: MemberApi.MemberInfo,
): member is ActiveRemoteArchiveMemberInfo {
	if (member.deviceType !== 'selfHostedServer') return false
	if (!member.selfHostedServerDetails) return false
	if (member.role.roleId !== MEMBER_ROLE_ID) return false
	return true
}

export function getRenderableFieldInfo({
	field,
	tags,
	answerTypeToTranslatedString,
}: {
	field: Field
	tags: Observation['tags'] | Track['tags']
	answerTypeToTranslatedString: {
		true: string
		false: string
		null: string
	}
}): { label: string; answer: string } {
	const { label, tagKey } = field

	const correspondingFieldValueFromTags = tags[tagKey]

	const renderedValue = (
		Array.isArray(correspondingFieldValueFromTags)
			? correspondingFieldValueFromTags
			: [correspondingFieldValueFromTags]
	)
		// Only keep answers with a meaningful value i.e. no `undefined`, `''` (can happen if an answer is deleted by the user) or whitespace-only strings.
		.filter((value): value is string | boolean | number | null => {
			if (typeof value === 'string' && value.trim().length === 0) {
				return false
			}

			return value !== undefined
		})
		.map((value) => {
			if (typeof value === 'string' || typeof value === 'number') {
				return value
			}

			if (typeof value === 'boolean') {
				return answerTypeToTranslatedString[value ? 'true' : 'false']
			}

			if (value === null) {
				return answerTypeToTranslatedString['null']
			}
		})
		.join(', ')

	return { label, answer: renderedValue }
}
