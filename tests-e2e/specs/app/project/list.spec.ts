import { hexToRgb } from '@mui/material/styles'
import { expect } from 'playwright/test'

import { COMAPEO_BLUE } from '../../../../src/renderer/src/colors.ts'
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
				.getByRole('navigation', { name: 'App navigation', exact: true })
				.getByRole('button', {
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

				await expect(projectListNavLink).toHaveCSS(
					'color',
					hexToRgb(COMAPEO_BLUE),
				)
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

	test('Project info popup', async ({ appInfo, projectParams, userParams }) => {
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
				.getByRole('navigation', { name: 'App navigation', exact: true })
				.getByRole('button', {
					name: `Go to project ${projectParams.projectName}.`,
					exact: true,
				})
				.click()

			// 2. Main tests
			const button = page
				.getByRole('navigation', { name: 'App navigation', exact: true })
				.getByRole('button', {
					name: `Show info for project ${projectParams.projectName}.`,
					exact: true,
				})

			/// Click to toggle on behavior
			await button.click()

			const describedById = await button.getAttribute('aria-describedby')
			expect(describedById).toBeTruthy()

			const popup = page.locator(`[role="dialog"][id="${describedById}"]`)
			await expect(popup).toBeVisible()
			expect(
				popup.getByRole('heading', {
					name: projectParams.projectName,
					exact: true,
				}),
			).toBeVisible()

			//// Popup list items
			const popupListItems = popup.getByRole('listitem')
			await expect(popupListItems).toHaveCount(3)

			const projectRoleItem = popupListItems.first()
			await expect(projectRoleItem).toHaveText('Coordinator')

			const categoriesSetItem = popupListItems.nth(1)
			await expect(
				categoriesSetItem.getByText(/^CoMapeo Default Categories \d\.\d$/),
			).toBeVisible()
			await expect(categoriesSetItem.getByText(/^Created .+$/)).toBeVisible()
			// TODO: Ideally check for the actual values
			const categoriesSetDateCreatedTime = categoriesSetItem.getByRole('time')
			await expect(categoriesSetDateCreatedTime).not.toBeEmpty()
			await expect(categoriesSetDateCreatedTime).toHaveAttribute('datetime')

			const projectSharingItem = popupListItems.last()
			await expect(projectSharingItem).toHaveText(
				/^Project Sharing \| (ON|OFF)$/,
			)

			/// Click to toggle off behavior
			await button.click()
			await expect(popup).not.toBeVisible()

			/// Blur behavior
			await button.blur()
			await expect(popup).not.toBeVisible()
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})
})
