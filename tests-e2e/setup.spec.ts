import { writeFile } from 'node:fs/promises'
import { _electron as electron } from '@playwright/test'

import { USER_DATA_PATH_FILE, test } from './utils.ts'

test('setup', async ({ appInfo }) => {
	const electronApp = await electron.launch({
		args: [appInfo.main],
		executablePath: appInfo.executable,
		timeout: 10_000,
	})

	const userDataPath = await electronApp.evaluate(async ({ app }) => {
		return app.getPath('userData')
	})

	await electronApp.close()

	await writeFile(USER_DATA_PATH_FILE, userDataPath, { encoding: 'utf-8' })
})
