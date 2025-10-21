import { hexToRgb } from '@mui/material/styles'
import {
	_electron as electron,
	expect,
	type ElectronApplication,
} from '@playwright/test'
import * as v from 'valibot'

import { COMAPEO_BLUE } from '../src/renderer/src/colors.ts'
import {
	OnboardingOutputsSchema,
	readOutputsFile,
	test,
	type OnboardingOutputs,
} from './utils.ts'

test.describe.configure({ mode: 'serial' })

let electronApp: ElectronApplication

let onboardingOutputs: OnboardingOutputs

test.beforeAll(async ({ appInfo }) => {
	electronApp = await electron.launch({
		args: [appInfo.main],
		executablePath: appInfo.executable,
		timeout: 10_000,
	})

	onboardingOutputs = v.parse(
		OnboardingOutputsSchema,
		JSON.parse(await readOutputsFile('onboarding')),
	)
})

test.afterAll(async () => {
	await electronApp?.close()
})

test('about page', async () => {
	const page = await electronApp.firstWindow()

	// Navigation
	const navLink = page
		.getByRole('navigation')
		.getByRole('link', { name: 'About CoMapeo', exact: true })
	await navLink.click()
	await expect(navLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))

	// Main
	const main = page.getByRole('main')

	await expect(
		main.getByRole('heading', { name: 'About CoMapeo', exact: true }),
	).toBeVisible()

	await expect(
		main.getByRole('heading', { name: 'CoMapeo Version', exact: true }),
	).toBeVisible()

	// TODO: Assert version number?
})

test('data and privacy page', async () => {
	const page = await electronApp.firstWindow()

	// Navigation
	const navLink = page
		.getByRole('navigation')
		.getByRole('link', { name: 'Data & Privacy', exact: true })
	await navLink.click()
	await expect(navLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))

	// Main
	const main = page.getByRole('main')

	await expect(
		main.getByRole('heading', { name: 'Data & Privacy', exact: true }),
	).toBeVisible()

	await expect(
		main.getByText('CoMapeo respects your privacy and autonomy', {
			exact: true,
		}),
	).toBeVisible()

	// TODO: Assert behavior of `Learn More` button
	await expect(
		main.getByRole('button', { name: 'Learn More', exact: true }),
	).toBeVisible()

	await expect(
		main.getByRole('heading', { name: 'Diagnostic Information', exact: true }),
	).toBeVisible()

	await expect(
		main.getByText(
			'Anonymized information about your device, app crashes, errors and performance helps Awana Digital improve the app and fix errors.',
			{ exact: true },
		),
	).toBeVisible()

	const infoListItems = main.getByRole('listitem')

	await expect(infoListItems).toHaveText([
		'This never includes any of your data or personal information.',
		'You can opt-out of sharing diagnostic information at any time.',
	])

	const diagnosticCheckbox = main.getByLabel('Share Diagnostic Information', {
		exact: true,
	})
	await expect(diagnosticCheckbox).not.toBeChecked()
	await diagnosticCheckbox.click()
	await expect(diagnosticCheckbox).toBeChecked()
	await diagnosticCheckbox.click()
	await expect(diagnosticCheckbox).not.toBeChecked()
})

test.describe('app settings', () => {
	test('index', async () => {
		const page = await electronApp.firstWindow()

		// Navigation
		const navLink = page
			.getByRole('navigation')
			.getByRole('link', { name: 'App Settings', exact: true })
		await navLink.click()
		await expect(navLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))

		// Main
		const main = page.getByRole('main')

		await expect(
			main.getByRole('heading', { name: 'App Settings', exact: true }),
		).toBeVisible()

		await expect(
			main.getByText('CoMapeo is set to the following.', { exact: true }),
		).toBeVisible()

		const settingsLinks = main.getByRole('link')

		await expect(settingsLinks).toHaveText([
			// TODO: Should fix this in app using aria-label?
			`${onboardingOutputs.deviceName}Edit`,
			// TODO: The result of this will vary based on system language preferences.
			/^English.*/,
			'UTM Coordinates',
			'Default Background',
			'Create Test Data',
		])
	})
})
