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
			// TODO: Should be heading
			page.getByText('CoMapeo Desktop'),
		).toBeVisible({
			// TODO: Sometimes takes a bit longer (especially in CI)
			timeout: 10_000,
		})

		await expect(
			// TODO: Should be heading
			page.getByText(
				'View and manage observations collected with CoMapeo Mobile.',
			),
		).toBeVisible({
			// TODO: Sometimes takes a bit longer (especially in CI)
			timeout: 10_000,
		})

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

		await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible()
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

		await page.getByRole('link', { name: 'Get Started' }).click()

		// 2. Main tests
		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.getByRole('link', { name: 'Get Started' }).click()

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

		await page.getByRole('link', { name: 'Get Started' }).click()
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
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('project landing', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		// 1. Setup
		const page = await electronApp.firstWindow()

		await page.getByRole('link', { name: 'Get Started' }).click()
		await page.getByRole('link', { name: 'Next', exact: true }).click()
		await page
			.getByRole('textbox', { name: 'Device Name', exact: true })
			.fill(userParams.deviceName)
		await page.getByRole('button', { name: 'Add Name', exact: true }).click()

		// 2. Main tests
		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.goForward()

		// TODO: Assertions against the onboarding steps indicator being present

		await expect(
			page.getByRole('heading', {
				name: `${userParams.deviceName} is ready!`,
				exact: true,
			}),
		).toBeVisible()

		await expect(
			page.getByRole('heading', {
				name: 'Choose from below to start your first project.',
				exact: true,
			}),
		).toBeVisible()

		await expect(
			page.getByRole('link', { name: 'Start New Project', exact: true }),
		).toBeVisible()

		await expect(
			page.getByRole('link', { name: 'Join a Project', exact: true }),
		).toBeVisible()
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('join project', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		// 1. Setup
		const page = await electronApp.firstWindow()

		await page.getByRole('link', { name: 'Get Started' }).click()
		await page.getByRole('link', { name: 'Next', exact: true }).click()
		await page
			.getByRole('textbox', { name: 'Device Name', exact: true })
			.fill(userParams.deviceName)
		await page.getByRole('button', { name: 'Add Name', exact: true }).click()
		await page
			.getByRole('link', { name: 'Join a Project', exact: true })
			.click()

		// 2. Main tests
		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.goForward()

		// TODO: Assertions against the onboarding steps indicator no longer being present
		await expect(
			page.getByRole('heading', { name: 'Join a Project', exact: true }),
		).toBeVisible()

		await expect(
			page.getByRole('heading', {
				name: 'Coordinate with your team to receive a project invitation.',
				exact: true,
			}),
		).toBeVisible()

		// TODO: Simulate invites being received
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('create project', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		// 1. Setup
		const page = await electronApp.firstWindow()

		await page.getByRole('link', { name: 'Get Started' }).click()
		await page.getByRole('link', { name: 'Next', exact: true }).click()
		await page
			.getByRole('textbox', { name: 'Device Name', exact: true })
			.fill(userParams.deviceName)
		await page.getByRole('button', { name: 'Add Name', exact: true }).click()
		await page
			.getByRole('link', { name: 'Start New Project', exact: true })
			.click()

		// 2. Main tests
		await page.getByRole('button', { name: 'Go back', exact: true }).click()
		await page.goForward()

		// TODO: Assertions against the onboarding steps indicator no longer being present

		await expect(
			page.getByRole('heading', { name: 'Start New Project', exact: true }),
		).toBeVisible()

		await expect(
			page.getByRole('heading', { name: 'Name your project.', exact: true }),
		).toBeVisible()

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			'0/100',
		)

		await page
			.getByRole('button', { name: 'Create', exact: true })
			.click({ force: true })

		await expect(
			page.getByText('Enter a Project Name', { exact: true }),
		).toBeVisible()

		const projectNameInput = page.getByRole('textbox', {
			name: 'Project Name',
			exact: true,
		})
		const invalidProjectName = Array(120).fill('a').join('')

		await projectNameInput.fill(invalidProjectName)

		await expect(
			page.getByText('Too long, try a shorter name.', { exact: true }),
		).toBeVisible()

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			`${invalidProjectName.length}/100`,
		)

		await page
			.getByRole('button', { name: 'Create', exact: true })
			.click({ force: true })

		await projectNameInput.fill('')

		await expect(
			page.getByText('Enter a Project Name', { exact: true }),
		).toBeVisible()

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			'0/100',
		)

		const projectNameToUse = 'Project (e2e)'

		await projectNameInput.fill(projectNameToUse)

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			`${projectNameToUse.length}/100`,
		)

		await page.getByRole('button', { name: 'Create', exact: true }).click()

		await expect(
			page.getByRole('button', { name: 'Go back', exact: true }),
		).not.toBeVisible({
			// NOTE: Depending on machine, project creation might take a bit longer.
			timeout: 10_000,
		})

		// TODO: Assertions against the onboarding steps indicator

		await expect(
			page.getByRole('heading', { name: 'Success!', exact: true }),
		).toBeVisible()

		await expect(
			page.getByRole('heading', {
				name: `${projectNameToUse} created.`,
				exact: true,
			}),
		).toBeVisible()

		// TODO: Ideally test that clicking each of these has expected behavior

		await expect(
			page.getByRole('link', { name: 'Invite Collaborators', exact: true }),
		).toBeVisible()

		await expect(
			page.getByRole('link', { name: 'Start Using CoMapeo', exact: true }),
		).toBeVisible()
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test.describe('navigation after project creation', () => {
	const projectNameToUse = 'Project (e2e)'

	test('invite collaborators', async ({ appInfo, userParams }) => {
		const { launchApp, cleanup } = await setup()
		const electronApp = await launchApp({ appInfo })

		try {
			// 1. Setup
			const page = await electronApp.firstWindow()

			await page.getByRole('link', { name: 'Get Started' }).click()
			await page.getByRole('link', { name: 'Next', exact: true }).click()
			await page
				.getByRole('textbox', { name: 'Device Name', exact: true })
				.fill(userParams.deviceName)
			await page.getByRole('button', { name: 'Add Name', exact: true }).click()
			await page
				.getByRole('link', { name: 'Start New Project', exact: true })
				.click()
			await page
				.getByRole('textbox', { name: 'Project Name', exact: true })
				.fill(projectNameToUse)
			await page.getByRole('button', { name: 'Create', exact: true }).click()

			// 2. Main tests
			await page
				.getByRole('link', { name: 'Invite Collaborators', exact: true })
				.click({
					// NOTE: Depending on machine, project creation might take a bit longer.
					timeout: 10_000,
				})

			await page.waitForURL((url) => {
				return /^#\/app\/projects\/[a-zA-Z0-9]+\/invite$/.test(url.hash)
			})
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})

	test('start using CoMapeo', async ({ appInfo, userParams }) => {
		const { launchApp, cleanup } = await setup()
		const electronApp = await launchApp({ appInfo })

		try {
			// 1. Setup
			const page = await electronApp.firstWindow()

			await page.getByRole('link', { name: 'Get Started' }).click()
			await page.getByRole('link', { name: 'Next', exact: true }).click()
			await page
				.getByRole('textbox', { name: 'Device Name', exact: true })
				.fill(userParams.deviceName)
			await page.getByRole('button', { name: 'Add Name', exact: true }).click()
			await page
				.getByRole('link', { name: 'Start New Project', exact: true })
				.click()
			await page
				.getByRole('textbox', { name: 'Project Name', exact: true })
				.fill(projectNameToUse)
			await page.getByRole('button', { name: 'Create', exact: true }).click()

			// 2. Main tests
			await page
				.getByRole('link', { name: 'Start Using CoMapeo', exact: true })
				.click({
					// NOTE: Depending on machine, project creation might take a bit longer.
					timeout: 10_000,
				})

			await page.waitForURL((url) => {
				return /^#\/app\/projects\/[a-zA-Z0-9]+/.test(url.hash)
			})
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})
})
