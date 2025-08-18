import * as v from 'valibot'

import languages from '../../languages.json' with { type: 'json' }

export const SUPPORTED_LANGUAGES = languages

export type SupportedLanguageTag = keyof typeof languages

const SUPPORTED_LANGUAGE_TAGS = Object.keys(
	languages,
) as Array<SupportedLanguageTag>

export const SupportedLanguageTagSchema = v.union(
	SUPPORTED_LANGUAGE_TAGS.map((t) => v.literal(t)),
)

export type LocaleSource = 'selected' | 'system' | 'fallback'

export type LocaleState = {
	source: LocaleSource
	value: SupportedLanguageTag
}

export const LocaleSchema = v.variant('useSystemPreferences', [
	v.object({
		useSystemPreferences: v.literal(true),
		languageTag: v.null(),
	}),
	v.object({
		useSystemPreferences: v.literal(false),
		languageTag: v.string(),
	}),
])

export type Locale = v.InferOutput<typeof LocaleSchema>
