import { platform } from 'node:os'
import {
	_electron as electron,
	expect,
	type ElectronApplication,
} from '@playwright/test'

import { test, writeOutputsFile, type OnboardingOutputs } from './utils.ts'

test.describe.configure({ mode: 'serial' })

let electronApp: ElectronApplication

test.beforeAll(async ({ appInfo }) => {
	electronApp = await electron.launch({
		args: [appInfo.main],
		executablePath: appInfo.executable,
		timeout: 10_000,
	})
})

test.afterAll(async () => {
	await electronApp?.close()
})

const OUTPUTS: OnboardingOutputs = {
	deviceName: 'Desktop (e2e)',
	projectName: 'Project e2e',
}

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

	await deviceNameInput.fill(OUTPUTS.deviceName)

	await expect(page.locator('output[name="character-count"]')).toHaveText(
		`${OUTPUTS.deviceName.length}/60`,
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
		.getByRole('button', { name: 'Create Project', exact: true })
		.click({ force: true })

	await projectNameInput.fill('')

	await expect(
		page.getByText('Enter a Project Name', { exact: true }),
	).toBeVisible()

	await expect(page.locator('output[name="character-count"]')).toHaveText(
		'0/100',
	)

	await projectNameInput.fill(OUTPUTS.projectName)

	await expect(page.locator('output[name="character-count"]')).toHaveText(
		`${OUTPUTS.projectName.length}/100`,
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
	).not.toBeVisible({
		// NOTE: Depending on machine, project creation might take a bit longer.
		timeout: 10_000,
	})

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

test('write outputs', async () => {
	await writeOutputsFile('onboarding', OUTPUTS)
})
