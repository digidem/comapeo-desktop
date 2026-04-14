import { mkdirSync } from 'node:fs'
import { glob, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { extract } from '@formatjs/cli-lib'

const { values } = parseArgs({
	strict: true,
	options: { type: { type: 'string' } },
})

if (values.type !== 'main' && values.type !== 'renderer') {
	throw new Error('type must be either main or renderer')
}

const PROJECT_ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))
const MESSAGES_DIR = fileURLToPath(
	new URL(`../messages/${values.type}`, import.meta.url),
)
const DEFAULT_LANGUAGE = 'en-US' as const
const OUTPUT_DIR = join(MESSAGES_DIR, DEFAULT_LANGUAGE)

mkdirSync(OUTPUT_DIR, { recursive: true })

const sourceFiles = (
	await Array.fromAsync(
		glob(`src/${values.type}/**/*.{js,jsx,ts,tsx}`, {
			cwd: PROJECT_ROOT_DIR,
			exclude: [`src/${values.type}/**/*.d.ts`],
			withFileTypes: true,
		}),
	)
)
	.filter((d) => d.isFile())
	.map((d) => join(d.parentPath, d.name))

const extracted: Record<string, unknown> = JSON.parse(
	await extract(sourceFiles, {
		ast: true,
		format: 'crowdin',
		throws: true,
	}),
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

console.log(
	`✅ Extracted messages from ${join('src', values.type)} to ${relative(PROJECT_ROOT_DIR, OUTPUT_DIR)}`,
)
