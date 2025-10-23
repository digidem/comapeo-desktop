import { mkdir } from 'node:fs/promises'
import { _electron as electron } from '@playwright/test'

import {
	OUTPUTS_DIR_PATH,
	test,
	writeOutputsFile,
	type SetupOutputs,
} from './utils.ts'

test('setup', async ({ appInfo }) => {
	const electronApp = await electron.launch({
		args: [appInfo.main],
		executablePath: appInfo.executable,
		timeout: 10_000,
	})

	const outputs: SetupOutputs = {
		userDataPath: await electronApp.evaluate(async ({ app }) => {
			return app.getPath('userData')
		}),
	}

	await electronApp.close()

	await mkdir(OUTPUTS_DIR_PATH)
	await writeOutputsFile('setup', outputs)
})
