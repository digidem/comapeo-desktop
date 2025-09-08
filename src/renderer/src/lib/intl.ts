import type { IntlConfig } from 'react-intl'
import * as v from 'valibot'

import {
	SUPPORTED_LANGUAGES,
	type SupportedLanguageTag,
} from '../../../shared/intl'
import TRANSLATED_LANGUAGE_TAGS from '../generated/translated-languages.generated.json'

const translations = import.meta.glob('./*.json', {
	base: '../../../../translations/renderer',
	import: 'default',
})

export const SupportedLanguageTagSchema = v.union(
	(Object.keys(SUPPORTED_LANGUAGES) as Array<SupportedLanguageTag>).map((t) =>
		v.literal(t),
	),
)

export function getLanguageInfo(languageTag: SupportedLanguageTag) {
	return SUPPORTED_LANGUAGES[languageTag]
}

export const usableLanguages = TRANSLATED_LANGUAGE_TAGS.map((l) => {
	v.assert(SupportedLanguageTagSchema, l)
	return { ...getLanguageInfo(l), languageTag: l }
})

export async function loadTranslations(
	language: SupportedLanguageTag,
): Promise<NonNullable<IntlConfig['messages']>> {
	// @ts-expect-error Not worth fixing
	return translations[`./${language}.json`]!()
}
