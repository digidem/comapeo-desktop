// Creates a JSON file that lists the language tags for which we have renderer translations.
// This is done so that this info is known at compile time instead of being calculated during run time.
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as v from 'valibot'

import SUPPORTED_LANGUAGES from '../languages.json' with { type: 'json' }

/**
 * @typedef { keyof typeof SUPPORTED_LANGUAGES } SupportedLanguageTag
 *
 * @typedef { (typeof SUPPORTED_LANGUAGES)[SupportedLanguageTag] } SupportedLanguageInfo
 */

const SUPPORTED_LANGUAGE_TAGS = /** @type { SupportedLanguageTag[] } */ (
	Object.keys(SUPPORTED_LANGUAGES)
)

const SupportedLanguageTagSchema = v.union(
	SUPPORTED_LANGUAGE_TAGS.map((t) => v.literal(t)),
)

const RENDERER_MESSAGES_DIR = fileURLToPath(
	new URL('../messages/renderer', import.meta.url),
)

/**
 * @type { SupportedLanguageTag[] }
 */
const translatedLanguages = []

const localeFolders = await readdir(RENDERER_MESSAGES_DIR, {
	withFileTypes: true,
})

for (const folder of localeFolders) {
	if (!folder.isDirectory()) {
		continue
	}

	const locale = folder.name

	if (!v.is(SupportedLanguageTagSchema, locale)) {
		console.warn(
			`Translated language tag "${locale}" is not listed as a supported language.\n\n
            Update languages.json with the relevant information in order for it to be displayed as an option in the application.`,
		)
		continue
	}

	const [coreMessages, primaryMessages, secondaryMessages] = await Promise.all([
		readFile(join(RENDERER_MESSAGES_DIR, locale, 'core.json'), {
			encoding: 'utf-8',
		}).then(JSON.parse),

		readFile(join(RENDERER_MESSAGES_DIR, locale, 'primary.json'), {
			encoding: 'utf-8',
		})
			.then(JSON.parse)
			.catch(() => {
				console.warn(`${locale}: no primary messages found`)
				return undefined
			}),

		readFile(join(RENDERER_MESSAGES_DIR, locale, 'primary.json'), {
			encoding: 'utf-8',
		})
			.then(JSON.parse)
			.catch(() => {
				console.warn(`${locale}: no secondary messages found`)
				return undefined
			}),
	])

	const messages = {
		...coreMessages,
		...primaryMessages,
		...secondaryMessages,
	}

	// TODO: This will need to be adjusted based on some defined criteria

	// If a language is added to Crowdin but has no translated messages,
	// Crowdin still creates an empty file. We do not include as a selectable language.
	if (Object.keys(messages).length === 0) {
		console.warn(
			`No translated messages for "${locale}". Not including as a translated language for the app to use.`,
		)
		continue
	}

	translatedLanguages.push(locale)
}

const OUTPUT_FILE = fileURLToPath(
	new URL(
		'../src/renderer/src/generated/translated-languages.generated.json',
		import.meta.url,
	),
)

await writeFile(OUTPUT_FILE, JSON.stringify(translatedLanguages))

console.log(`✅ Generated file at ${OUTPUT_FILE}`)
