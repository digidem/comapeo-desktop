import { expect } from 'playwright/test'

import { setup, test } from './utils.ts'

test.describe.configure({ mode: 'parallel' })

test('app opens', async ({ appInfo }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		await expect(page).toHaveURL((url) => {
			return (
				url.protocol === 'comapeo:' &&
				url.host === 'renderer' &&
				url.pathname === '/index.html'
			)
		})
	} finally {
		await electronApp.close()
		cleanup()
	}
})
