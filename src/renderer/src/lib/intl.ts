import type { IntlConfig } from 'react-intl'
import * as v from 'valibot'

import {
	SUPPORTED_LANGUAGES,
	type SupportedLanguageTag,
} from '../../../shared/intl.ts'
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

	const [baseTag, regionTag] = l.split('-')

	v.assert(SupportedLanguageTagSchema, baseTag)

	return {
		...getLanguageInfo(l),
		languageTag: l,
		// NOTE: Attach the language info associated with the language tag's "base" language if applicable.
		baseLanguageInfo: regionTag ? getLanguageInfo(baseTag) : undefined,
	}
})

export async function loadTranslations(
	languageTag: SupportedLanguageTag,
): Promise<NonNullable<IntlConfig['messages']>> {
	const [baseTag, regionTag] = languageTag.split('-')

	if (!baseTag) {
		throw new Error(`Cannot get base tag from ${languageTag}`)
	}

	const relevantTranslations = Array.from(Object.entries(translations))
		// NOTE: Only work with translations that share the same base tag
		.filter(([filePath]) => {
			return filePath.startsWith(`./${baseTag}-`)
		}) // NOTE: Sort alphanumerically except for exact match, which should be last.
		.sort(([a], [b]) => {
			if (regionTag && a === `./${languageTag}.json`) {
				return 1
			}

			return b.localeCompare(a)
		})

	let messages = {} as NonNullable<IntlConfig['messages']>

	const importResults = await Promise.all(
		relevantTranslations.map(([_filePath, importFn]) => importFn()),
	)

	for (const r of importResults) {
		messages = {
			...messages,
			// @ts-expect-error Not worth fixing
			...r,
		}
	}

	return messages
}
