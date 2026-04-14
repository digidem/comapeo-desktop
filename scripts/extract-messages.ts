import { mkdirSync } from 'node:fs'
import { glob, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extract } from '@formatjs/cli-lib'

const PROJECT_ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))

const MESSAGES_DIR_MAIN = fileURLToPath(
	new URL('../messages/main', import.meta.url),
)
const MESSAGES_DIR_RENDERER = fileURLToPath(
	new URL('../messages/renderer', import.meta.url),
)

const DEFAULT_LANGUAGE = 'en-US' as const

const OUTPUT_DIR_MAIN = join(MESSAGES_DIR_MAIN, DEFAULT_LANGUAGE)
const OUTPUT_DIR_RENDERER = join(MESSAGES_DIR_RENDERER, DEFAULT_LANGUAGE)

mkdirSync(OUTPUT_DIR_MAIN, { recursive: true })
mkdirSync(OUTPUT_DIR_RENDERER, { recursive: true })

const [main, renderer] = await Promise.all([extractMain(), extractRenderer()])

await Promise.all([
	writeFile(
		join(OUTPUT_DIR_MAIN, 'primary.json'),
		JSON.stringify(main.primary, undefined, 2),
		'utf-8',
	),
	writeFile(
		join(OUTPUT_DIR_MAIN, 'secondary.json'),
		JSON.stringify(main.secondary, undefined, 2),
		'utf-8',
	),
	writeFile(
		join(OUTPUT_DIR_RENDERER, 'primary.json'),
		JSON.stringify(renderer.primary, undefined, 2),
		'utf-8',
	),
	writeFile(
		join(OUTPUT_DIR_RENDERER, 'secondary.json'),
		JSON.stringify(renderer.secondary, undefined, 2),
		'utf-8',
	),
])

async function extractMain() {
	const files = await Array.fromAsync(
		glob('src/main/**/*.{js,ts}', {
			cwd: PROJECT_ROOT_DIR,
			exclude: ['src/main/**/*.d.ts'],
		}),
	)

	const extracted = JSON.parse(
		await extract(files, { ast: true, format: 'crowdin' }),
	)

	return getCategorizedMessages(extracted)
}

async function extractRenderer() {
	const files = await Array.fromAsync(
		glob('src/renderer/**/*.{js,jsx,ts,tsx}', {
			cwd: PROJECT_ROOT_DIR,
			exclude: ['src/renderer/**/*.d.ts'],
		}),
	)

	const extracted = JSON.parse(
		await extract(files, { ast: true, format: 'crowdin' }),
	)

	return getCategorizedMessages(extracted)
}

async function getCategorizedMessages(messages: Record<string, unknown>) {
	const primary = {} as Record<string, unknown>
	const secondary = {} as Record<string, unknown>

	for (const messageId of Object.keys(messages)) {
		if (messageId.startsWith('$1.')) {
			primary[messageId] = messages[messageId]
		} else {
			secondary[messageId] = messages[messageId]
		}
	}

	return { primary, secondary }
}
