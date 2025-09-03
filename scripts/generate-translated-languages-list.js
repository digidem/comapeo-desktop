// Creates a JSON file that lists the language tags for which we have renderer translations.
// This is done so that this info is known at compile time instead of being calculated during run time.
import fs from 'node:fs'
import { glob } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
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

const RENDERER_MESSAGES_DIR = fileURLToPath(
	new URL('../messages/renderer', import.meta.url),
)

/**
 * @type {SupportedLanguageTag[]}
 */
const translatedLanguages = []

for await (const entry of glob('*.json', { cwd: RENDERER_MESSAGES_DIR })) {
	const match = entry.match(/(?<language>.+)\.json/)

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

	const messages = await import(join(RENDERER_MESSAGES_DIR, entry), {
		with: { type: 'json' },
	})

	// If a language is added to Crowdin but has no translated messages,
	// Crowdin still creates an empty file. We do not include as a selectable language.
	if (Object.keys(messages).length === 0) {
		console.warn(
			`No translated messages for "${matchedLanguage}". Not including as a translated language for the app to use.`,
		)
		continue
	}

	translatedLanguages.push(matchedLanguage)
}

const OUTPUT_FILE = './src/renderer/translated-languages.generated.json'

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(translatedLanguages))

console.log(`✅ Generated file at ${OUTPUT_FILE}`)
