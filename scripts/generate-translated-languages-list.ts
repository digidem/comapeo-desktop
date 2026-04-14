// Creates a JSON file that lists the language tags for which we have renderer translations.
// This is done so that this info is known at compile time instead of being calculated during run time.
import fs, { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as v from 'valibot'

import SUPPORTED_LANGUAGES from '../languages.json' with { type: 'json' }

type SupportedLanguageTag = keyof typeof SUPPORTED_LANGUAGES

const SUPPORTED_LANGUAGE_TAGS = Object.keys(
	SUPPORTED_LANGUAGES,
) as Array<SupportedLanguageTag>

const SupportedLanguageTagSchema = v.union(
	SUPPORTED_LANGUAGE_TAGS.map((t) => v.literal(t)),
)

const RENDERER_MESSAGES_DIR = fileURLToPath(
	new URL('../messages/renderer', import.meta.url),
)

const unsupportedLanguages: Array<string> = []
const languagesMissingTranslations: Array<SupportedLanguageTag> = []
const translatedLanguages: Array<SupportedLanguageTag> = []

const directories = readdirSync(RENDERER_MESSAGES_DIR, {
	withFileTypes: true,
}).filter((d) => d.isDirectory())

for (const d of directories) {
	const languageCode = d.name

	if (!v.is(SupportedLanguageTagSchema, languageCode)) {
		unsupportedLanguages.push(languageCode)
		continue
	}

	const primaryMessages = JSON.parse(
		readFileSync(join(d.parentPath, d.name, 'primary.json'), {
			encoding: 'utf-8',
		}),
	)

	const secondaryMessages = JSON.parse(
		readFileSync(join(d.parentPath, d.name, 'secondary.json'), {
			encoding: 'utf-8',
		}),
	)

	if (
		Object.keys(primaryMessages).length +
			Object.keys(secondaryMessages).length ===
		0
	) {
		languagesMissingTranslations.push(languageCode)
		continue
	}

	translatedLanguages.push(languageCode)
}

if (unsupportedLanguages.length > 0) {
	console.warn(
		`⚠️ The following translated language tags are not listed as supported: ${unsupportedLanguages.join(', ')}\nUpdate languages.json with the relevant information in order for it to be displayed as an option in the application.\n`,
	)
}

if (languagesMissingTranslations.length > 0) {
	console.warn(
		`⚠️ The following language tags do not have translations: ${languagesMissingTranslations.join(', ')}.\nThese will not be available for the app to use.\n`,
	)
}

const OUTPUT_FILE = fileURLToPath(
	new URL(
		'../src/renderer/src/generated/translated-languages.generated.json',
		import.meta.url,
	),
)

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(translatedLanguages))

console.log(`✅ Generated file at ${OUTPUT_FILE}`)
