// Creates a JSON file that lists the language tags for which we have renderer translations.
// This is done so that this info is known at compile time instead of being calculated during run time.
import fs, { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { styleText } from 'node:util'
import * as v from 'valibot'

import SUPPORTED_LANGUAGES from '../languages.json' with { type: 'json' }

type SupportedLanguageTag = keyof typeof SUPPORTED_LANGUAGES

const SUPPORTED_LANGUAGE_TAGS = Object.keys(
	SUPPORTED_LANGUAGES,
) as Array<SupportedLanguageTag>

const SupportedLanguageTagSchema = v.union(
	SUPPORTED_LANGUAGE_TAGS.map((t) => v.literal(t)),
)

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url))
const MESSAGES_DIR = join(PROJECT_ROOT, 'messages')

const unsupportedLanguages: Array<string> = []
const languagesMissingTranslations: Array<SupportedLanguageTag> = []
const translatedLanguages: Array<SupportedLanguageTag> = []

const directories = readdirSync(MESSAGES_DIR, { withFileTypes: true }).filter(
	(d) => d.isDirectory(),
)

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

	const rendererPrimaryIds = Object.keys(primaryMessages).filter(
		(id) => !isMainId(id),
	)

	const rendererSecondaryIds = Object.keys(secondaryMessages).filter(
		(id) => !isMainId(id),
	)

	if (rendererPrimaryIds.length + rendererSecondaryIds.length === 0) {
		languagesMissingTranslations.push(languageCode)
		continue
	}

	translatedLanguages.push(languageCode)
}

if (unsupportedLanguages.length > 0) {
	console.warn(
		`⚠️ The following translated language tags are not listed as supported: ${styleText('bold', unsupportedLanguages.join(', '))}\nUpdate languages.json with the relevant information in order for it to be displayed as an option in the application.\n`,
	)
}

if (languagesMissingTranslations.length > 0) {
	console.warn(
		`⚠️ The following language tags do not have translations: ${styleText('bold', languagesMissingTranslations.join(', '))}.\nThese will not be available for the app to use.\n`,
	)
}

const OUTPUT_FILE = join(
	PROJECT_ROOT,
	'src',
	'renderer',
	'src',
	'generated',
	'translated-languages.generated.json',
)

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(translatedLanguages))

console.log(`✅ Generated file at ${relative(PROJECT_ROOT, OUTPUT_FILE)}`)

function isMainId(id: string) {
	return id.startsWith('$1.main.') || id.startsWith('main.')
}
