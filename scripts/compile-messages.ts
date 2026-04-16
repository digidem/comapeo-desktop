import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from '@formatjs/cli-lib'

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url))
const MESSAGES_DIR = join(PROJECT_ROOT, 'messages')
const TRANSLATIONS_DIR = join(PROJECT_ROOT, 'translations')

const TRANSLATIONS_DIR_MAIN = join(TRANSLATIONS_DIR, 'main')
const TRANSLATIONS_DIR_RENDERER = join(TRANSLATIONS_DIR, 'renderer')

const languageSourceDirectories = readdirSync(MESSAGES_DIR, {
	withFileTypes: true,
}).filter((d) => d.isDirectory())

rmSync(TRANSLATIONS_DIR, { recursive: true, force: true })
mkdirSync(TRANSLATIONS_DIR_MAIN, { recursive: true })
mkdirSync(TRANSLATIONS_DIR_RENDERER, { recursive: true })

for (const d of languageSourceDirectories) {
	const languageCode = d.name

	const compiled = await compile(
		[
			join(d.parentPath, d.name, 'primary.json'),
			join(d.parentPath, d.name, 'secondary.json'),
		],
		{ ast: true, format: 'crowdin' },
	)

	const parsed = JSON.parse(compiled)

	const compiledMain = {} as Record<string, unknown>
	const compiledRenderer = {} as Record<string, unknown>

	for (const id of Object.keys(parsed)) {
		const isMainId = id.startsWith('$1.main.') || id.startsWith('main.')

		if (isMainId) {
			compiledMain[id] = parsed[id]
		} else {
			compiledRenderer[id] = parsed[id]
		}
	}

	writeFileSync(
		join(TRANSLATIONS_DIR_MAIN, `${languageCode}.json`),
		JSON.stringify(compiledMain),
		'utf-8',
	)

	writeFileSync(
		join(TRANSLATIONS_DIR_RENDERER, `${languageCode}.json`),
		JSON.stringify(compiledRenderer),
		'utf-8',
	)
}

console.log('✅ Compiled messages from /messages to /translations')
