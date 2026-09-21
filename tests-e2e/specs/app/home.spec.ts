import { hexToRgb } from '@mui/material/styles'
import { expect } from '@playwright/test'

import { COMAPEO_BLUE } from '../../../src/renderer/src/colors.ts'
import {
	setup,
	simulateCreateProject,
	simulateOnboarding,
	test,
} from '../utils.ts'

test.describe.configure({ mode: 'parallel' })

test('initial page after onboarding', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		// 1. Setup
		const page = await electronApp.firstWindow()

		await simulateOnboarding({ deviceName: userParams.deviceName, page })

		// 2. Main tests

		const main = page.getByRole('main')

		// Header section
		{
			await expect(
				main.getByRole('heading', { name: 'All Projects', exact: true }),
			).toBeVisible()

			await expect(main.getByText('Most Recent', { exact: true })).toBeVisible()

			await expect(
				page.getByRole('link', { name: 'Start New Project', exact: true }),
			).toBeVisible()

			await expect(
				page.getByRole('link', { name: 'CoMapeo Settings', exact: true }),
			).toBeVisible()
		}

		// Main panel section
		{
			await expect(
				main.getByText(`${userParams.deviceName} is ready!`, { exact: true }),
			).toBeVisible()

			await expect(
				main.getByText(
					'Coordinate with a team to join them or start a new project.',
					{ exact: true },
				),
			).toBeVisible()

			await expect(main.getByRole('list').getByRole('listitem')).toHaveText([
				'Map anywhere and everywhere',
				'Securely share with others',
				'Own and control your data',
			])
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
			.getByRole('link', { name: 'Start New Project', exact: true })
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
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('listed project sections', async ({
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

		const projectName01 = `${projectParams.projectName} 01`

		await simulateCreateProject({
			page,
			projectName: projectName01,
		})

		// 2. Main tests
		const main = page.getByRole('main')

		const sections = main.locator('section')

		// Assertions for listed projects after creating first project
		{
			await expect(sections).toHaveCount(1)

			const currentProjectSection = sections.nth(0)

			await expect(
				currentProjectSection.getByRole('heading', {
					name: 'Current Project',
					exact: true,
				}),
			).toBeVisible()

			const projectCard01 = currentProjectSection.getByRole('link', {
				name: `Go to project ${projectName01}.`,
				exact: true,
			})

			await expect(projectCard01).toBeVisible()

			await expect(projectCard01).toHaveCSS(
				'border-color',
				hexToRgb(COMAPEO_BLUE),
			)
		}

		const projectName02 = `${projectParams.projectName} 02`

		await simulateCreateProject({
			page,
			projectName: projectName02,
		})

		// Assertions for listed projects after creating second project
		{
			await expect(sections).toHaveCount(2)

			const currentProjectSection = sections.nth(0)
			const otherProjectsSection = sections.nth(1)

			await expect(
				currentProjectSection.getByRole('heading', {
					name: 'Current Project',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				otherProjectsSection.getByRole('heading', {
					name: 'Other Projects',
					exact: true,
				}),
			).toBeVisible()

			const projectCard02 = currentProjectSection.getByRole('link', {
				name: `Go to project ${projectName02}.`,
				exact: true,
			})

			await expect(projectCard02).toBeVisible()

			await expect(projectCard02).toHaveCSS(
				'border-color',
				hexToRgb(COMAPEO_BLUE),
			)

			const projectCard01 = otherProjectsSection.getByRole('link', {
				name: `Go to project ${projectName01}.`,
				exact: true,
			})

			await expect(projectCard01).toBeVisible()

			await expect(projectCard01).not.toHaveCSS(
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

// TODO: Local storage is not getting set/persisted across page instances?
test.skip('initial page when re-opening app', async ({
	appInfo,
	projectParams,
	userParams,
}) => {
	const { launchApp, cleanup } = await setup()
	let electronApp = await launchApp({ appInfo })

	try {
		// 1. Setup
		let page = await electronApp.firstWindow()

		await simulateOnboarding({ deviceName: userParams.deviceName, page })

		await simulateCreateProject({
			page,
			projectName: projectParams.projectName,
		})

		// 2. Main tests

		await electronApp.close()
		electronApp = await launchApp({ appInfo })
		page = await electronApp.firstWindow()

		await page.waitForURL((url) => {
			return new URLPattern({
				pathname: '/app',
			}).test({ pathname: url.hash.slice(1) })
		})

		await page
			.getByRole('link', {
				name: `Go to project ${projectParams.projectName}.`,
				exact: true,
			})
			.click()

		await page.waitForURL((url) => {
			return new URLPattern({
				pathname: '/app/projects/:projectId',
			}).test({ pathname: url.hash.slice(1) })
		})

		await electronApp.close()
		electronApp = await launchApp({ appInfo })
		page = await electronApp.firstWindow()

		// TODO: This assertion fails. End up on home page.
		await page.waitForURL((url) => {
			return new URLPattern({
				pathname: '/app/projects/:projectId',
			}).test({ pathname: url.hash.slice(1) })
		})
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})
