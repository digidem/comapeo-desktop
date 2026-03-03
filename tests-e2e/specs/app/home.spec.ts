import { hexToRgb } from '@mui/material/styles'
import { expect } from '@playwright/test'

import { COMAPEO_BLUE } from '../../../src/renderer/src/colors.ts'
import { setup, simulateOnboarding, test } from '../utils.ts'

test.describe.configure({ mode: 'parallel' })

test('join project', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		// 1. Setup
		const page = await electronApp.firstWindow()

		await simulateOnboarding({ deviceName: userParams.deviceName, page })

		// 2. Main tests

		await page
			.getByRole('main')
			.getByRole('button', { name: 'Join a Project', exact: true })
			.click()

		// Join project dialog assertions
		{
			const dialog = page.getByRole('dialog')

			await expect(
				dialog.getByRole('button', { name: 'Go back', exact: true }),
			).toBeVisible()

			await expect(
				dialog.getByRole('heading', { name: 'Join a Project', exact: true }),
			).toBeVisible()

			await expect(
				dialog.getByText(
					'Coordinate with your team to receive a project invitation.',
					{ exact: true },
				),
			).toBeVisible()

			// TODO: Simulate invites being received

			await dialog.getByRole('button', { name: 'Go back', exact: true }).click()

			await expect(dialog).not.toBeVisible()
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('create project', async ({ appInfo, projectParams, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		// 1. Setup
		const page = await electronApp.firstWindow()

		await simulateOnboarding({ deviceName: userParams.deviceName, page })

		// 2. Main tests

		await page
			.getByRole('main')
			.getByRole('button', { name: 'Start New Project', exact: true })
			.click()

		// Start new project dialog assertions
		{
			const dialog = page.getByRole('dialog')

			await expect(
				dialog.getByRole('button', { name: 'Go back', exact: true }),
			).toBeVisible()

			await expect(
				dialog.getByRole('heading', { name: 'Start New Project', exact: true }),
			).toBeVisible()

			await expect(
				dialog.getByText('Name your project.', { exact: true }),
			).toBeVisible()

			await expect(dialog.locator('output[name="character-count"]')).toHaveText(
				'0/100',
			)

			await dialog
				.getByRole('button', { name: 'Create', exact: true })
				.click({ force: true })

			await expect(
				dialog.getByText('Enter a Project Name', { exact: true }),
			).toBeVisible()

			const projectNameInput = dialog.getByRole('textbox', {
				name: 'Project Name',
				exact: true,
			})

			const invalidProjectName = Array(120).fill('a').join('')

			await projectNameInput.fill(invalidProjectName)

			await expect(
				dialog.getByText('Too long, try a shorter name.', { exact: true }),
			).toBeVisible()

			await expect(dialog.locator('output[name="character-count"]')).toHaveText(
				`${invalidProjectName.length}/100`,
			)

			await dialog
				.getByRole('button', { name: 'Create', exact: true })
				.click({ force: true })

			await projectNameInput.fill('')

			await expect(
				dialog.getByText('Enter a Project Name', { exact: true }),
			).toBeVisible()

			await expect(dialog.locator('output[name="character-count"]')).toHaveText(
				'0/100',
			)

			await projectNameInput.fill(projectParams.projectName)

			await expect(dialog.locator('output[name="character-count"]')).toHaveText(
				`${projectParams.projectName.length}/100`,
			)

			await dialog.getByRole('button', { name: 'Create', exact: true }).click()

			await expect(dialog).not.toBeVisible()
		}

		await page.waitForURL((url) => {
			return new URLPattern({
				pathname: '/app/projects/:projectId',
			}).test({ pathname: url.hash.slice(1) })
		})

		// App nav after project creation assertions
		{
			const appNav = page.getByRole('navigation', {
				name: 'App navigation',
				exact: true,
			})

			await expect(
				appNav.getByRole('button', {
					name: `Show info for project ${projectParams.projectName}.`,
					exact: true,
				}),
			).toBeVisible()

			await appNav.getByRole('link', { name: 'Home', exact: true }).click()

			await expect(
				appNav.getByRole('button', {
					name: `Go to project ${projectParams.projectName}.`,
					exact: true,
				}),
			).toBeVisible()
		}

		// Project card on home page assertions
		{
			const projectCard = page.getByRole('main').getByRole('link', {
				name: `Go to project ${projectParams.projectName}`,
			})

			await expect(projectCard).toHaveCount(1)

			await expect(projectCard).toHaveCSS(
				'border-color',
				hexToRgb(COMAPEO_BLUE),
			)
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})
