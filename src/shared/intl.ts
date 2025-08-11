import SUPPORTED_LANGUAGES from '../../languages.json' with { type: 'json' }

export type LocaleSource = 'selected' | 'system' | 'fallback'

export type SupportedLanguageTag = keyof typeof SUPPORTED_LANGUAGES

export type LocaleState = {
	source: LocaleSource
	value: SupportedLanguageTag
}
