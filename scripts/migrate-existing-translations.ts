import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url))

for (const type of ['main', 'renderer'] as const) {
	const primaryIds = getPrimaryIds(type)

	const languageMessagesFiles = readdirSync(
		join(PROJECT_ROOT, 'messages', type),
		{ withFileTypes: true },
	).filter((d) => d.isFile() && d.name !== 'en.json')

	for (const f of languageMessagesFiles) {
		const languageCode = basename(f.name, extname(f.name))

		const messages = JSON.parse(
			readFileSync(join(f.parentPath, f.name), 'utf-8'),
		)

		const primary = {} as Record<string, unknown>
		const secondary = {} as Record<string, unknown>

		for (const messageId of Object.keys(messages)) {
			const matchingPrimaryId = primaryIds.find((i) => i === `$1.${messageId}`)

			if (matchingPrimaryId) {
				primary[matchingPrimaryId] = messages[messageId]
			} else {
				secondary[messageId] = messages[messageId]
			}
		}

		const outputDir = join(PROJECT_ROOT, 'messages', type, languageCode)

		mkdirSync(outputDir, { recursive: true })

		writeFileSync(
			join(outputDir, 'primary.json'),
			JSON.stringify(primary, undefined, 2),
		)

		writeFileSync(
			join(outputDir, 'secondary.json'),
			JSON.stringify(secondary, undefined, 2),
		)
	}
}

function getPrimaryIds(type: 'main' | 'renderer') {
	const sourceMessagesPrimary = JSON.parse(
		readFileSync(
			join(PROJECT_ROOT, 'messages', type, 'en-US', 'primary.json'),
			'utf-8',
		),
	)

	return Object.keys(sourceMessagesPrimary)
}
