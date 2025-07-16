// Creates a JSON file that lists the language tags for which we have renderer translations.
// This is done so that this info is known at compile time instead of being calculated during run time.
import fs from 'node:fs'
import { glob } from 'node:fs/promises'
import * as prettier from 'prettier'
import * as v from 'valibot'

import SUPPORTED_LANGUAGES from '../languages.json' with { type: 'json' }

/**
 * @typedef {keyof typeof SUPPORTED_LANGUAGES} SupportedLanguageTag
 *
 * @typedef {(typeof SUPPORTED_LANGUAGES)[SupportedLanguageTag]} SupportedLanguageInfo
 */

const SUPPORTED_LANGUAGE_TAGS = /** @type {SupportedLanguageTag[]} */ (
	Object.keys(SUPPORTED_LANGUAGES)
)

/**
 * @typedef {{
 * 	languageTag: SupportedLanguageTag
 * 	nativeName: string
 * 	englishName: string
 * }} UsableLanguage
 */

const SupportedLanguageTagSchema = v.union(
	SUPPORTED_LANGUAGE_TAGS.map((t) => v.literal(t)),
)

/**
 * @type {SupportedLanguageTag[]}
 */
const translatedLanguages = []

for await (const entry of glob('./messages/renderer/*.json')) {
	const match = entry.match(/renderer\/(?<language>.+)\.json/)

	const matchedLanguage = match?.groups?.language

	if (!matchedLanguage) {
		throw new Error(`Could not extract language tag from: ${entry}`)
	}

	if (!v.is(SupportedLanguageTagSchema, matchedLanguage)) {
		console.warn(
			`Translated language tag "${matchedLanguage}" is not listed as a supported language.\n\n
            Update languages.json with the relevant information in order for it to be displayed as an option in the application.`,
		)
		continue
	}

	translatedLanguages.push(matchedLanguage)
}

const OUTPUT_FILE = './src/renderer/translated-languages.generated.json'

const formatted = await prettier.format(JSON.stringify(translatedLanguages), {
	filepath: OUTPUT_FILE,
})

fs.writeFileSync(OUTPUT_FILE, formatted)

console.log(`✅ Generated file at ${OUTPUT_FILE}`)
