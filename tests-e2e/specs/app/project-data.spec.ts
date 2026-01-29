import { hexToRgb } from '@mui/material/styles'
import { expect } from 'playwright/test'

import { COMAPEO_BLUE } from '../../../src/renderer/src/colors.ts'
import { setup, simulateOnboarding, test } from '../utils.ts'

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
				projectName: projectParams.projectName,
			})

			// 2. Main tests

			/// Navigation
			{
				// Assert nav rail state
				const projectDataNavLink = page
					.getByRole('navigation')
					.getByRole('link', { name: 'View project.', exact: true })

				await expect(projectDataNavLink).toHaveCSS(
					'color',
					hexToRgb(COMAPEO_BLUE),
				)
			}

			const main = page.getByRole('main')

			//// Project info popup button
			await expect(
				main.getByRole('button', {
					name: projectParams.projectName,
					exact: true,
				}),
			).toBeVisible()

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
				projectName: projectParams.projectName,
			})

			// 2. Main tests
			const main = page.getByRole('main')

			const button = main.getByRole('button', {
				name: projectParams.projectName,
				exact: true,
			})

			const tooltip = page.getByRole('tooltip', {
				name: 'View Project Info',
				exact: true,
			})

			await expect(button).toBeVisible()

			/// Hover behavior
			await button.hover()
			await expect(button).not.toHaveCSS('border-color', hexToRgb(COMAPEO_BLUE))
			await expect(tooltip).toBeVisible()

			/// Focus behavior
			await button.focus()
			await expect(button).toHaveCSS('border-color', hexToRgb(COMAPEO_BLUE))
			await expect(tooltip).toBeVisible()

			/// Click to toggle on behavior
			await button.click()
			await expect(button).toHaveCSS('border-color', hexToRgb(COMAPEO_BLUE))
			await expect(tooltip).not.toBeVisible()

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
			await expect(button).toHaveCSS('border-color', hexToRgb(COMAPEO_BLUE))
			await expect(popup).not.toBeVisible()
			await expect(tooltip).toBeVisible()

			/// Blur behavior
			await button.blur()
			await expect(button).not.toHaveCSS('border-color', hexToRgb(COMAPEO_BLUE))
			await expect(popup).not.toBeVisible()
			await expect(tooltip).not.toBeVisible()
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})
})
