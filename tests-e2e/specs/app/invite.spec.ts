import { hexToRgb } from '@mui/material/styles'
import { expect } from 'playwright/test'

import { COMAPEO_BLUE } from '../../../src/renderer/src/colors.ts'
import { setup, simulateOnboarding, test } from '../utils.ts'

test.describe.configure({ mode: 'parallel' })

test.describe('Invite device flow', () => {
	test('No existing members and no invitable devices', async ({
		appInfo,
		userParams,
		projectParams,
	}) => {
		const { cleanup, launchApp } = await setup()
		const electronApp = await launchApp({ appInfo })

		try {
			const page = await electronApp.firstWindow()

			// 1. Simulate onboarding
			await simulateOnboarding({
				deviceName: userParams.deviceName,
				page,
				projectName: projectParams.projectName,
			})

			// 2. Main tests
			const main = page.getByRole('main')

			/// Navigation
			{
				// Navigate to invite page
				await main
					.getByRole('link', { name: 'Invite Device', exact: true })
					.click()

				await main
					.getByRole('button', { name: 'Go back.', exact: true })
					.click()

				await main
					.getByRole('link', { name: 'Invite Device', exact: true })
					.click()

				// Assert nav rail state
				await expect(
					page
						.getByRole('navigation')
						.getByRole('link', { name: 'View project.', exact: true }),
				).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))
			}

			/// Main

			//// Invite landing
			{
				await expect(
					main.getByRole('heading', { name: 'Get Started', exact: true }),
				).toBeVisible()

				await expect(
					main.getByRole('heading', {
						name: 'Invite Collaborators',
						exact: true,
					}),
				).toBeVisible()

				await expect(
					main.getByText(
						'Invite devices using CoMapeo to start collaborating.',
						{
							exact: true,
						},
					),
				).toBeVisible()

				await expect(main.getByRole('listitem')).toHaveText([
					'Only invited devices contribute.',
					'Collaborators share securely using Exchange.',
					'Control sharing in Project Settings.',
				])

				await main
					.getByRole('link', { name: 'Select a Device', exact: true })
					.click()
			}

			//// Device selection
			{
				await expect(
					main.getByRole('heading', { name: 'Select a Device', exact: true }),
				).toBeVisible()

				const networkConnectionInfo = main.getByTestId(
					'invite-devices-list-network-connection-info',
				)

				await expect(networkConnectionInfo).not.toHaveText(
					'Getting Wi-Fi information…',
					{ timeout: 10_000 },
				)

				await expect(networkConnectionInfo).not.toBeEmpty()

				await expect(
					main.getByText('Not seeing a device?', { exact: true }),
				).toBeVisible()

				await expect(main.getByRole('listitem')).toHaveText([
					'Check that devices are on the same Wi-Fi network',
					'Confirm that devices are using the same version of CoMapeo',
				])
			}

			//// Back button navigation behavior
			{
				await main
					.getByRole('button', { name: 'Go back.', exact: true })
					.click()

				await page.waitForURL(
					(url) => {
						return new URLPattern({
							pathname: '/app/projects/:projectId',
						}).test({ pathname: url.hash.slice(1) })
					},
					{ timeout: 1_000 },
				)
			}
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})
})
