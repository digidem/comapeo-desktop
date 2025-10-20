import { readFile, rm } from 'node:fs/promises'

import { USER_DATA_PATH_FILE, test } from './utils.ts'

test('teardown', async () => {
	const userDataPath = await readFile(USER_DATA_PATH_FILE, {
		encoding: 'utf-8',
	})

	if (userDataPath) {
		console.log(`Removing user data at ${userDataPath}`)
		await rm(userDataPath, { recursive: true })
	}
})
