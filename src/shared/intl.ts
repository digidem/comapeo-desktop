import * as v from 'valibot'

import SUPPORTED_LANGUAGES from '../../languages.json' with { type: 'json' }

export type LocaleSource = 'selected' | 'system' | 'fallback'

export type SupportedLanguageTag = keyof typeof SUPPORTED_LANGUAGES

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
