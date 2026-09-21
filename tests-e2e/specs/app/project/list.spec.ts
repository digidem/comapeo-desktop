import { expect } from 'playwright/test'

import {
	setup,
	simulateCreateProject,
	simulateOnboarding,
	test,
} from '../../utils.ts'

test.describe.configure({ mode: 'parallel' })

test.describe('Main panel (coordinator)', () => {
	test('Initial solo state', async ({ appInfo, projectParams, userParams }) => {
		const { cleanup, launchApp } = await setup()
		const electronApp = await launchApp({ appInfo })

		try {
			const page = await electronApp.firstWindow()

			// 1. Simulate onboarding
			await simulateOnboarding({
				deviceName: userParams.deviceName,
				page,
			})

			await simulateCreateProject({
				page,
				projectName: projectParams.projectName,
			})

			await page
				.getByRole('link', {
					name: `Go to project ${projectParams.projectName}.`,
					exact: true,
				})
				.click()

			// 2. Main tests

			/// Navigation
			{
				// Assert nav rail state
				const projectListNavLink = page
					.getByRole('navigation', { name: 'Project navigation', exact: true })
					.getByRole('link', { name: 'List', exact: true })

				await expect(projectListNavLink).toHaveAttribute('aria-current', 'page')
			}

			const main = page.getByRole('main')

			//// Collaborators prompt
			await expect(
				main.getByRole('heading', {
					name: 'Invite Collaborators',
					exact: true,
				}),
			).toBeVisible()
			await expect(
				main.getByText(
					'Invite devices to start gathering observations and tracks.',
					{ exact: true },
				),
			).toBeVisible()
			await expect(
				main.getByRole('link', { name: 'Invite Device', exact: true }),
			).toBeVisible()
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})
})
