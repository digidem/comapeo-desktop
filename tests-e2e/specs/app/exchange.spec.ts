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
				main.getByRole('heading', {
					name: 'Looking for devices…',
					exact: true,
				}),
			).toBeVisible()

			await expect(main.getByRole('progressbar')).not.toBeVisible()
		}

		//// Start exchange
		{
			const startButton = main.getByRole('button', {
				name: 'Start',
				exact: true,
			})
			await expect(startButton).toBeVisible()
			await startButton.click()

			const disabledNavLinks = page
				.getByRole('navigation')
				.getByRole('link', { disabled: true })

			await expect(disabledNavLinks.first()).toHaveAccessibleName(
				'View project.',
			)

			await expect(disabledNavLinks).toHaveText([
				'',
				'Team',
				'Tools',
				'Settings',
			])

			await expect(
				main.getByRole('heading', {
					name: 'Waiting for Devices',
					exact: true,
				}),
			).toBeVisible()

			await expect(main.getByRole('progressbar')).toBeVisible()

			await expect(main.getByText(/^\d%$/)).toBeVisible()
		}

		//// Stop exchange
		{
			const stopButton = main.getByRole('button', {
				name: 'Stop',
				exact: true,
			})
			await expect(stopButton).toBeVisible()
			await stopButton.click()

			const disabledNavLinks = page
				.getByRole('navigation')
				.getByRole('link', { disabled: true })

			await expect(disabledNavLinks).toHaveCount(0)
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})
