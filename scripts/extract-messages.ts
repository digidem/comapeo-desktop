import { mkdirSync } from 'node:fs'
import { glob, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extract } from '@formatjs/cli-lib'

const PROJECT_ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))
const MESSAGES_DIR = join(PROJECT_ROOT_DIR, 'messages')

const DEFAULT_LANGUAGE_TAG = 'en-US' as const
const OUTPUT_DIR = join(MESSAGES_DIR, DEFAULT_LANGUAGE_TAG)

const sourceFiles = (
	await Array.fromAsync(
		glob(`src/**/*.{js,jsx,ts,tsx}`, {
			cwd: PROJECT_ROOT_DIR,
			exclude: [`src/**/*.d.ts`],
			withFileTypes: true,
		}),
	)
)
	.filter((d) => d.isFile())
	.map((d) => join(d.parentPath, d.name))

const extracted: Record<string, unknown> = JSON.parse(
	await extract(sourceFiles, { ast: true, format: 'crowdin', throws: true }),
)

const primary = {} as Record<string, unknown>
const secondary = {} as Record<string, unknown>

for (const messageId of Object.keys(extracted)) {
	if (messageId.startsWith('$1.')) {
		primary[messageId] = extracted[messageId]
	} else {
		secondary[messageId] = extracted[messageId]
	}
}

mkdirSync(OUTPUT_DIR, { recursive: true })

await Promise.all([
	writeFile(
		join(OUTPUT_DIR, 'primary.json'),
		JSON.stringify(primary, undefined, 2) + '\n',
		'utf-8',
	),
	writeFile(
		join(OUTPUT_DIR, 'secondary.json'),
		JSON.stringify(secondary, undefined, 2) + '\n',
		'utf-8',
	),
])

console.log('✅ Extracted messages from src/ to messages/')
