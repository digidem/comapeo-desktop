import languages from '../../../languages.json' with { type: 'json' }

export type LocaleSource = 'selected' | 'system' | 'fallback'

export type SupportedLanguageTag = keyof typeof languages

export type LocaleState = {
	source: LocaleSource
	value: SupportedLanguageTag
}
