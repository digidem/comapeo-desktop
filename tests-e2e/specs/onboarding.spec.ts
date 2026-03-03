import { platform } from 'node:os'
import { expect } from '@playwright/test'

import { setup, test } from './utils.ts'

test.describe.configure({ mode: 'parallel' })

test('welcome page', async ({ appInfo }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		// 1. Setup
		const page = await electronApp.firstWindow()

		// 2. Main tests
		if (platform() === 'darwin') {
			await expect(page.getByTestId('app-title-bar')).toBeVisible()
		} else {
			await expect(page.getByTestId('app-title-bar')).not.toBeVisible()
		}

		await expect(
			page.getByRole('heading', { name: 'CoMapeo Desktop', exact: true }),
		).toBeVisible({
			// NOTE: Takes a while, especially in CI
			timeout: 15_000,
		})

		await expect(
			page.getByText(
				'View and manage observations collected with CoMapeo Mobile.',
				{ exact: true },
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

		await expect(
			page.getByRole('link', { name: 'Get Started', exact: true }),
		).toBeVisible()
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('data and privacy step', async ({ appInfo }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		// 1. Setup
		const page = await electronApp.firstWindow()

		await page.getByRole('link', { name: 'Get Started', exact: true }).click()

		// 2. Main tests
		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.getByRole('link', { name: 'Get Started', exact: true }).click()

		// TODO: Assertions against the onboarding steps indicator

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
			featureListItems.getByText('All data stays fully encrypted.', {
				exact: true,
			}),
		).toBeVisible()

		await expect(
			featureListItems.getByText('Your data stays on your devices.', {
				exact: true,
			}),
		).toBeVisible()

		await expect(
			featureListItems.getByText(
				'Easily manage and control sharing and collaboration.',
				{ exact: true },
			),
		).toBeVisible()

		await expect(
			featureListItems.getByText(
				'Private by default — diagnostic information is made fully anonymous and you can opt-out any time.',
				{ exact: true },
			),
		).toBeVisible()

		await page.getByRole('link', { name: 'Learn More', exact: true }).click()

		// Privacy Policy
		await expect(
			page.getByRole('heading', { name: 'Privacy Policy', exact: true }),
		).toBeVisible()

		const diagnosticCheckbox = page.getByRole('checkbox', {
			name: 'Share Diagnostic Information',
			exact: true,
		})
		await expect(diagnosticCheckbox).toBeChecked()
		await diagnosticCheckbox.click()
		await expect(diagnosticCheckbox).not.toBeChecked()

		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.getByRole('link', { name: 'Learn More', exact: true }).click()

		await expect(
			page.getByRole('checkbox', {
				name: 'Share Diagnostic Information',
				exact: true,
			}),
		).not.toBeChecked()

		await page.getByRole('button', { name: 'Go back', exact: true }).click()

		await page.getByRole('link', { name: 'Next', exact: true }).click()
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('device name step', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		// 1. Setup
		const page = await electronApp.firstWindow()

		await page.getByRole('link', { name: 'Get Started', exact: true }).click()
		await page.getByRole('link', { name: 'Next', exact: true }).click()

		// 2. Main tests
		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.getByRole('link', { name: 'Next', exact: true }).click()

		// TODO: Assertions against the onboarding steps indicator

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

		const deviceNameInput = page.getByRole('textbox', {
			name: 'Device Name',
			exact: true,
		})

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

		await deviceNameInput.fill(userParams.deviceName)

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			`${userParams.deviceName.length}/60`,
		)

		await page.getByRole('button', { name: 'Add Name', exact: true }).click()

		await page.waitForURL((url) => {
			return /^#\/app$/.test(url.hash)
		})

		await expect(
			page.getByRole('heading', {
				name: `${userParams.deviceName} is ready!`,
				exact: true,
			}),
		).toBeVisible()

		await page.reload()

		await expect(
			page.getByRole('heading', {
				name: `${userParams.deviceName}'s Projects`,
				exact: true,
			}),
		).toBeVisible()
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})
