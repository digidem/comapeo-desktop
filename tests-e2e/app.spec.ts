import {
	_electron as electron,
	expect,
	type ElectronApplication,
} from '@playwright/test'

import { test } from './utils.ts'

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

test('about page', async () => {
	const page = await electronApp.firstWindow()

	await page
		.getByRole('navigation')
		.getByRole('link', { name: 'About CoMapeo', exact: true })
		.click()

	await expect(
		page.getByRole('heading', { name: 'About CoMapeo', exact: true }),
	).toBeVisible()

	await expect(
		page.getByRole('heading', { name: 'CoMapeo Version', exact: true }),
	).toBeVisible()

	// TODO: Assert version number?
})

test('data and privacy page', async () => {
	const page = await electronApp.firstWindow()

	await page
		.getByRole('navigation')
		.getByRole('link', { name: 'Data & Privacy', exact: true })
		.click()

	await expect(
		page.getByRole('heading', { name: 'Data & Privacy', exact: true }),
	).toBeVisible()

	await expect(
		page.getByText('CoMapeo respects your privacy and autonomy', {
			exact: true,
		}),
	).toBeVisible()

	// TODO: Assert behavior of `Learn More` button
	await expect(
		page.getByRole('button', { name: 'Learn More', exact: true }),
	).toBeVisible()

	await expect(
		page.getByRole('heading', { name: 'Diagnostic Information', exact: true }),
	).toBeVisible()

	await expect(
		page.getByText(
			'Anonymized information about your device, app crashes, errors and performance helps Awana Digital improve the app and fix errors.',
			{ exact: true },
		),
	).toBeVisible()

	const infoListItems = page.getByRole('listitem')

	await expect(
		infoListItems.getByText(
			'This never includes any of your data or personal information.',
			{ exact: true },
		),
	).toBeVisible()

	await expect(
		infoListItems.getByText(
			'You can opt-out of sharing diagnostic information at any time.',
			{ exact: true },
		),
	).toBeVisible()

	const diagnosticCheckbox = page.getByLabel('Share Diagnostic Information', {
		exact: true,
	})
	await expect(diagnosticCheckbox).not.toBeChecked()
	await diagnosticCheckbox.click()
	await expect(diagnosticCheckbox).toBeChecked()
	await diagnosticCheckbox.click()
	await expect(diagnosticCheckbox).not.toBeChecked()
})
