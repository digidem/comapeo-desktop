import { expect } from '@playwright/test'

import {
	setup,
	simulateCreateProject,
	simulateOnboarding,
	test,
} from '../utils.ts'

test.describe.configure({ mode: 'parallel' })

test('solo', async ({ appInfo, projectParams, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
		})

		await simulateCreateProject({
			page,
			projectName: projectParams.projectName,
		})

		await page
			.getByRole('navigation', { name: 'App navigation', exact: true })
			.getByRole('button', {
				name: `Go to project ${projectParams.projectName}.`,
				exact: true,
			})
			.click()

		// 2. Main tests

		/// Navigation
		{
			// TODO: Exchange navigation tab no longer exposed in UI when initially creating a project.
			const url = new URL(page.url())

			url.hash = url.hash + '/exchange'

			page.goto(url.href)

			// Navigate to exchange page
			// const exchangeNavLink = page
			// 	.getByRole('navigation', { name: 'Project navigation', exact: true })
			// 	.getByRole('link', { name: 'View exchange.', exact: true })
			// await exchangeNavLink.click()
			// Assert nav rail state
			// await expect(exchangeNavLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))
		}

		/// Main
		const main = page.getByRole('main')

		//// Initial state
		{
			const networkConnectionInfo = main.getByTestId(
				'exchange-network-connection-info',
			)
			await expect(networkConnectionInfo).toHaveText(
				'Getting Wi-Fi information…',
				{ timeout: 0 },
			)
			await expect(networkConnectionInfo).not.toHaveText(
				'Getting Wi-Fi information…',
				{ timeout: 10_000 },
			)
			// TODO: Ideally check for actual values
			await expect(networkConnectionInfo).not.toBeEmpty()
			await expect(networkConnectionInfo).not.toHaveText('&lt;redacted&gt;')

			await expect(
				main.getByText('No other devices are on this project.', {
					exact: true,
				}),
			).toBeVisible()

			await expect(
				main.getByRole('link', { name: 'Invite Devices', exact: true }),
			).toBeVisible()
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})
