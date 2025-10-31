import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { safeParse } from 'valibot'

import { OUTPUTS_DIR_PATH, SetupOutputsSchema, test } from './utils.ts'

test('teardown', async () => {
	const content = await readFile(
		join(OUTPUTS_DIR_PATH, 'setup.json'),
		'utf-8',
	).catch((err) => {
		console.error(err)
		return null
	})

	if (!content) {
		return
	}

	const result = safeParse(SetupOutputsSchema, JSON.parse(content))

	if (result.success) {
		const { userDataPath } = result.output
		console.log(`Removing user data at ${userDataPath}`)
		await rm(userDataPath, { recursive: true })
	}
})
