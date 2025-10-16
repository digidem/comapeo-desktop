import { rm } from 'node:fs/promises'
import { platform } from 'node:os'
import {
	_electron as electron,
	expect,
	test,
	type ElectronApplication,
} from '@playwright/test'
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers'

test.describe.configure({ mode: 'serial' })

let electronApp: ElectronApplication

test.beforeAll(async () => {
	const latestBuild = findLatestBuild()
	const appInfo = parseElectronApp(latestBuild)

	if (appInfo.packageJson.productName !== 'CoMapeo Desktop Internal') {
		throw new Error(
			'Tests can only be run against internal builds of the application',
		)
	}

	electronApp = await electron.launch({
		args: [appInfo.main],
		executablePath: appInfo.executable,
		timeout: 10_000,
	})
})

test.afterAll(async () => {
	const userDataPath = await electronApp.evaluate(async ({ app }) => {
		return app.getPath('userData')
	})

	await electronApp.close()

	console.log(`Removing data at ${userDataPath}`)
	await rm(userDataPath, { recursive: true, force: true })
})

test.describe('onboarding', () => {
	test('welcome page', async () => {
		const page = await electronApp.firstWindow()

		if (platform() === 'darwin') {
			await expect(page.getByTestId('app-title-bar')).toBeVisible()
		} else {
			await expect(page.getByTestId('app-title-bar')).not.toBeVisible()
		}

		await expect(
			// TODO: Should be heading
			page.getByText('CoMapeo Desktop'),
		).toBeVisible()

		await expect(
			// TODO: Should be heading
			page.getByText(
				'View and manage observations collected with CoMapeo Mobile.',
			),
		).toBeVisible()

		const featureList = page.getByRole('list')

		await expect(featureList).toBeVisible()

		const featureListItems = featureList.getByRole('listitem')

		await expect(
			featureListItems.getByText('Map anywhere and everywhere', {
				exact: true,
			}),
		).toBeVisible()

		await expect(
			featureListItems.getByText('Collaborate on projects', { exact: true }),
		).toBeVisible()

		await expect(
			featureListItems.getByText('Own and control your data', { exact: true }),
		).toBeVisible()

		await expect(
			featureListItems.getByText(
				'Designed with and for Indigenous peoples & frontline communities',
				{ exact: true },
			),
		).toBeVisible()

		await page.getByRole('link', { name: 'Get Started' }).click()
	})

	test('data and privacy step', async () => {
		const page = await electronApp.firstWindow()

		// Header
		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.getByRole('link', { name: 'Get Started' }).click()

		// TODO: Assertions against the onboarding steps indicator

		// Page
		await expect(
			page.getByRole('heading', { name: 'Review Data & Privacy', exact: true }),
		).toBeVisible()

		await expect(
			page.getByRole('heading', {
				name: 'CoMapeo allows teams to map offline without needing internet servers.',
				exact: true,
			}),
		).toBeVisible()

		const featureList = page.getByRole('list')

		await expect(featureList).toBeVisible()

		const featureListItems = page.getByRole('listitem')

		await expect(
			featureListItems.getByText('All data stays fully encrypted.'),
		).toBeVisible()

		await expect(
			featureListItems.getByText('Your data stays on your devices.'),
		).toBeVisible()

		await expect(
			featureListItems.getByText(
				'Easily manage and control sharing and collaboration.',
			),
		).toBeVisible()

		await expect(
			featureListItems.getByText(
				'Private by default — diagnostic information is made fully anonymous and you can opt-out any time.',
			),
		).toBeVisible()

		await page.getByRole('link', { name: 'Learn More', exact: true }).click()

		// Privacy Policy
		await expect(
			page.getByRole('heading', { name: 'Privacy Policy', exact: true }),
		).toBeVisible()

		const diagnosticCheckbox = page.getByLabel('Share Diagnostic Information', {
			exact: true,
		})
		await expect(diagnosticCheckbox).toBeChecked()
		await diagnosticCheckbox.click()
		await expect(diagnosticCheckbox).not.toBeChecked()

		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.getByRole('link', { name: 'Learn More', exact: true }).click()

		await expect(
			page.getByLabel('Share Diagnostic Information', { exact: true }),
		).not.toBeChecked()

		await page.getByRole('button', { name: 'Go back', exact: true }).click()

		await page.getByRole('link', { name: 'Next', exact: true }).click()
	})

	test('device name step', async () => {
		const page = await electronApp.firstWindow()

		// Header
		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.getByRole('link', { name: 'Next', exact: true }).click()

		// TODO: Assertions against the onboarding steps indicator

		// Page
		await expect(
			page.getByRole('heading', { name: 'Name Your Device', exact: true }),
		).toBeVisible()

		await expect(
			page.getByRole('heading', {
				name: 'Distinct, memorable names help collaborators recognize you.',
				exact: true,
			}),
		).toBeVisible()

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			'0/60',
		)

		await page
			.getByRole('button', { name: 'Add Name', exact: true })
			.click({ force: true })

		await expect(
			page.getByText('Enter a Device Name', { exact: true }),
		).toBeVisible()

		const deviceNameInput = page.getByLabel('Device Name', { exact: true })

		const invalidDeviceName = Array(100).fill('a').join('')

		await deviceNameInput.fill(invalidDeviceName)

		await expect(
			page.getByText('Too long, try a shorter name.', { exact: true }),
		).toBeVisible()

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			`${invalidDeviceName.length}/60`,
		)

		await page
			.getByRole('button', { name: 'Add Name', exact: true })
			.click({ force: true })

		await deviceNameInput.fill('')

		await expect(
			page.getByText('Enter a Device Name', { exact: true }),
		).toBeVisible()

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			'0/60',
		)

		const validDeviceName = 'Desktop (e2e)'

		await deviceNameInput.fill(validDeviceName)

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			`${validDeviceName.length}/60`,
		)

		await page.getByRole('button', { name: 'Add Name', exact: true }).click()
	})

	test('project step', async () => {
		const page = await electronApp.firstWindow()

		// Header
		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.goForward()

		// TODO: Assertions against the onboarding steps indicator

		// Page
		await expect(
			page.getByRole('heading', { name: 'Join a Project', exact: true }),
		).toBeVisible()

		await expect(
			page.getByRole('heading', {
				name: 'Ask a monitoring coordinator to join their Project.',
				exact: true,
			}),
		).toBeVisible()

		await expect(
			page.getByText('Starting a new territory monitoring project?', {
				exact: true,
			}),
		).toBeVisible()

		await page
			.getByRole('link', { name: 'Create a Project', exact: true })
			.click()
	})

	test('create project', async () => {
		const page = await electronApp.firstWindow()

		// Header
		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.goForward()

		// TODO: Assertions against the onboarding steps indicator

		// Page
		await expect(
			page.getByRole('heading', { name: 'Create a Project', exact: true }),
		).toBeVisible()

		await expect(
			page.getByRole('heading', { name: 'Name your project.', exact: true }),
		).toBeVisible()

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			'0/100',
		)

		await page
			.getByRole('button', { name: 'Create Project', exact: true })
			.click({ force: true })

		await expect(
			page.getByText('Enter a Project Name', { exact: true }),
		).toBeVisible()

		const projectNameInput = page.getByLabel('Project Name', { exact: true })

		const invalidProjectName = Array(120).fill('a').join('')

		await projectNameInput.fill(invalidProjectName)

		await expect(
			page.getByText('Too long, try a shorter name.', { exact: true }),
		).toBeVisible()

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			`${invalidProjectName.length}/100`,
		)

		await page
			.getByRole('button', { name: 'Create Project', exact: true })
			.click({ force: true })

		await projectNameInput.fill('')

		await expect(
			page.getByText('Enter a Project Name', { exact: true }),
		).toBeVisible()

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			'0/100',
		)

		const validProjectName = 'Project e2e'

		await projectNameInput.fill(validProjectName)

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			`${validProjectName.length}/100`,
		)

		await page
			.getByRole('button', { name: 'Create Project', exact: true })
			.click()
	})

	test('create project success', async () => {
		const page = await electronApp.firstWindow()

		// Header
		await expect(
			page.getByRole('button', { name: 'Go back', exact: true }),
		).not.toBeVisible()

		// TODO: Assertions against the onboarding steps indicator

		// Page
		await expect(
			page.getByRole('heading', { name: 'Success!', exact: true }),
		).toBeVisible()

		await expect(
			page.getByRole('heading', {
				name: 'You created Project e2e',
				exact: true,
			}),
		).toBeVisible()

		// TODO: Ideally test that clicking each of these has expected behavior

		await expect(
			page.getByRole('link', { name: 'Update Categories Set', exact: true }),
		).toBeVisible()

		await expect(
			page.getByRole('link', { name: 'Invite Collaborators', exact: true }),
		).toBeVisible()
	})
})
