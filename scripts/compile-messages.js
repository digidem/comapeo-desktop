import fs from 'node:fs/promises'
import path, { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { compile } from '@formatjs/cli-lib'

const PROJECT_ROOT_DIR_PATH = fileURLToPath(new URL('../', import.meta.url))
const BASE_TRANSLATIONS_DIR_PATH = path.join(
	PROJECT_ROOT_DIR_PATH,
	'translations',
)
const BASE_MESSAGES_DIR_PATH = path.join(PROJECT_ROOT_DIR_PATH, 'messages')

const { values } = parseArgs({
	strict: true,
	options: { type: { type: 'string' } },
})

if (!(values.type === 'main' || values.type === 'renderer')) {
	throw new Error('Type must be main or renderer')
}

await run(values.type)

/**
 * @param { 'main' | 'renderer' } type
 */
async function run(type) {
	const translationsPath = join(BASE_TRANSLATIONS_DIR_PATH, type)
	const messagesPath = join(BASE_MESSAGES_DIR_PATH, type)

	await fs.rm(translationsPath, { force: true, recursive: true })
	await fs.mkdir(translationsPath, { recursive: true })
	const localesFolders = await fs.readdir(messagesPath, { withFileTypes: true })
	const promises = []

	for (const folder of localesFolders) {
		if (!folder.isDirectory()) continue
		const locale = folder.name
		const inputPath = path.join(messagesPath, locale)
		const outputPath = path.join(translationsPath, `${locale}.json`)
		promises.push(compileFolder(inputPath, outputPath))
	}

	await Promise.all(promises)

	console.log(`Successfully built translations to ${translationsPath}`)
}

/**
 * @param { string } inputPath
 * @param { string } outputPath
 */
async function compileFolder(inputPath, outputPath) {
	const entries = await fs.readdir(inputPath, { withFileTypes: true })

	const messagesPaths = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
		.map((entry) => path.join(inputPath, entry.name))

	const compiled = await compile(messagesPaths, {
		ast: true,
		format: 'crowdin',
	})

	await fs.writeFile(outputPath, compiled)
}
