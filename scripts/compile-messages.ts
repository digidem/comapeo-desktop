import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { styleText } from 'node:util'
import { compile } from '@formatjs/cli-lib'

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url))
const MESSAGES_DIR = join(PROJECT_ROOT, 'messages')
const TRANSLATIONS_DIR = join(PROJECT_ROOT, 'translations')

await Promise.all([compileMessages('main'), compileMessages('renderer')])

async function compileMessages(type: 'main' | 'renderer') {
	const sourceDir = join(MESSAGES_DIR, type)
	const outputDir = join(TRANSLATIONS_DIR, type)

	mkdirSync(outputDir, { recursive: true })

	const directories = readdirSync(sourceDir, {
		withFileTypes: true,
	}).filter((d) => d.isDirectory())

	for (const d of directories) {
		const languageCode = d.name

		const compiled = await compile(
			[
				join(d.parentPath, d.name, 'primary.json'),
				join(d.parentPath, d.name, 'secondary.json'),
			],
			{ ast: true, format: 'crowdin' },
		)

		const outputFile = join(outputDir, `${languageCode}.json`)

		writeFileSync(outputFile, compiled, 'utf-8')
	}

	console.log(
		styleText(
			['green'],
			`Compiled messages from ${relative(PROJECT_ROOT, sourceDir)} to ${relative(PROJECT_ROOT, outputDir)}`,
		),
	)
}
