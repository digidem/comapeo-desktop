import { expect } from '@playwright/test'

import {
	setup,
	simulateCreateProject,
	simulateOnboarding,
	test,
} from '../utils.ts'

test.describe.configure({ mode: 'parallel' })

test.describe('switching between projects', () => {
	test('using project switcher', async ({
		appInfo,
		projectParams,
		userParams,
	}) => {
		const { launchApp, cleanup } = await setup()
		const electronApp = await launchApp({ appInfo })

		try {
			// 1. Setup
			const page = await electronApp.firstWindow()

			await simulateOnboarding({ deviceName: userParams.deviceName, page })

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

			const projectSwitcherTrigger = page.getByRole('button', {
				name: 'Switch Project',
				exact: true,
			})

			await projectSwitcherTrigger.click()

			const projectSwitcherMenu = page
				.getByRole('menu')
				.filter({ has: page.getByText(userParams.deviceName, { exact: true }) })

			await expect(projectSwitcherMenu).toBeVisible()

			/// After creation of first project
			{
				const menuItems = projectSwitcherMenu.getByRole('menuitem')

				await expect(menuItems).toHaveCount(2)

				await expect(menuItems.nth(0)).toHaveText(projectParams.projectName)
				await expect(menuItems.nth(0)).toHaveAttribute('aria-current', 'page')

				await expect(menuItems.nth(1)).toHaveText('View All Projects')

				await menuItems.nth(1).click()
			}

			const projectName02 = `${projectParams.projectName} 02`

			await simulateCreateProject({
				page,
				projectName: projectName02,
			})

			await page
				.getByRole('link', {
					name: `Go to project ${projectName02}.`,
					exact: true,
				})
				.click()

			await projectSwitcherTrigger.click()
			await expect(projectSwitcherMenu).toBeVisible()

			/// After creation of and navigation to second project
			{
				const menuItems = projectSwitcherMenu.getByRole('menuitem')

				await expect(menuItems).toHaveCount(3)

				await expect(menuItems.nth(0)).toHaveText(projectName02)
				await expect(menuItems.nth(0)).toHaveAttribute('aria-current', 'page')

				await expect(menuItems.nth(1)).toHaveText(projectParams.projectName)
				await expect(menuItems.nth(1)).not.toHaveAttribute(
					'aria-current',
					'page',
				)

				await expect(menuItems.nth(2)).toHaveText('View All Projects')

				/// Switch to first project using project switcher
				await menuItems.nth(1).click()
			}

			/// After switching projects using switcher
			{
				await expect(projectSwitcherMenu).not.toBeVisible()

				await projectSwitcherTrigger.click()

				await expect(projectSwitcherMenu).toBeVisible()

				const menuItems = projectSwitcherMenu.getByRole('menuitem')

				await expect(menuItems).toHaveCount(3)

				await expect(menuItems.nth(0)).toHaveText(projectParams.projectName)
				await expect(menuItems.nth(0)).toHaveAttribute('aria-current', 'page')

				await expect(menuItems.nth(1)).toHaveText(projectName02)
				await expect(menuItems.nth(1)).not.toHaveAttribute(
					'aria-current',
					'page',
				)

				await expect(menuItems.nth(2)).toHaveText('View All Projects')
			}
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})
})
