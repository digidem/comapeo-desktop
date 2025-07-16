import type { IntlConfig } from 'react-intl'
import * as v from 'valibot'

import SUPPORTED_LANGUAGES from '../../../../languages.json'

export { SUPPORTED_LANGUAGES }

export type SupportedLanguageTag = keyof typeof SUPPORTED_LANGUAGES

// @ts-expect-error Not worth fixing
const SUPPORTED_LANGUAGE_TAGS: Array<SupportedLanguageTag> =
	Object.keys(SUPPORTED_LANGUAGES)

export const SupportedLanguageTagSchema = v.union(
	SUPPORTED_LANGUAGE_TAGS.map((t) => v.literal(t)),
)

const messages = import.meta.glob('./*.json', {
	base: '../../../../translations/renderer',
	import: 'default',
})

export const TRANSLATED_LANGUAGE_TAGS: Array<SupportedLanguageTag> = []

// TODO: Do as a build step
for (const path of Object.keys(messages)) {
	const match = path.match(/\.\/(?<language>.+)\.json/)

	const matchedLanguage = match?.groups?.language

	if (!matchedLanguage) {
		throw new Error(`Could not extract language tag from: ${path}`)
	}

	if (!v.is(SupportedLanguageTagSchema, matchedLanguage)) {
		throw new Error(
			`Translated language tag "${matchedLanguage}" is not a valid supported language tag.`,
		)
	}

	TRANSLATED_LANGUAGE_TAGS.push(matchedLanguage)
}

export interface UsableLanguage {
	/** IETF BCP 47 language tag (https://en.wikipedia.org/wiki/IETF_language_tag) */
	languageTag: SupportedLanguageTag
	/** Localized name for language */
	nativeName: string
	/** English name for language */
	englishName: string
}

export const usableLanguages: Array<UsableLanguage> = []

for (const languageTag of TRANSLATED_LANGUAGE_TAGS) {
	const supportedLanguage = SUPPORTED_LANGUAGES[languageTag]

	usableLanguages.push({
		englishName: supportedLanguage.englishName,
		nativeName: supportedLanguage.nativeName,
		languageTag: languageTag,
	})
}

usableLanguages.sort((a, b) => {
	return a.englishName.localeCompare(b.englishName)
})

export async function loadTranslations(
	language: SupportedLanguageTag,
): Promise<NonNullable<IntlConfig['messages']>> {
	// @ts-expect-error Not worth fixing
	return await messages[`./${language}.json`]!()
}
