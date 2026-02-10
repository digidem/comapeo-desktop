import { hexToRgb } from '@mui/material/styles'
import { expect } from '@playwright/test'

import { COMAPEO_BLUE } from '../../../src/renderer/src/colors.ts'
import { setup, simulateOnboarding, test } from '../utils.ts'

test.describe.configure({ mode: 'parallel' })

test('solo ', async ({ appInfo, projectParams, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
			projectName: projectParams.projectName,
		})

		// 2. Main tests

		/// Navigation
		{
			// Navigate to exchange page
			const exchangeNavLink = page
				.getByRole('navigation')
				.getByRole('link', { name: 'View exchange.', exact: true })

			await exchangeNavLink.click()

			// Assert nav rail state
			await expect(exchangeNavLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))
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
