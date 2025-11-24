import { createRequire } from 'node:module'
import { fileURLToPath } from 'url'
import { hexToRgb } from '@mui/material/styles'
import {
	_electron as electron,
	expect,
	type ElectronApplication,
} from '@playwright/test'
import { stubDialog } from 'electron-playwright-helpers'
import * as v from 'valibot'

import {
	COMAPEO_BLUE,
	PROJECT_BLUE,
	PROJECT_GREEN,
	PROJECT_GREY,
	PROJECT_ORANGE,
	PROJECT_RED,
} from '../src/renderer/src/colors.ts'
import {
	OnboardingOutputsSchema,
	readOutputsFile,
	test,
	writeOutputsFile,
	type AppOutputs,
	type OnboardingOutputs,
} from './utils.ts'

test.describe.configure({ mode: 'serial' })

let electronApp: ElectronApplication

let onboardingOutputs: OnboardingOutputs

const OUTPUTS: AppOutputs = {
	deviceName: 'Desktop e2e Updated',
	projectName: 'Project e2e Updated',
	projectDescription: 'Updated project description for e2e tests',
	projectColor: { name: 'Orange', hexCode: PROJECT_ORANGE },
}

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

	const diagnosticCheckbox = main.getByRole('checkbox', {
		name: 'Share Diagnostic Information',
		exact: true,
	})
	// NOTE: Using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) is sometimes flaky in CI
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

	test('device name', async () => {
		const page = await electronApp.firstWindow()

		const main = page.getByRole('main')

		const deviceNameSettingsLink = main.getByRole('link', {
			name: 'Go to device name settings.',
			exact: true,
		})

		await expect(deviceNameSettingsLink).toHaveText(
			`${onboardingOutputs.deviceName}Edit`,
		)

		await deviceNameSettingsLink.click()

		// Navigation
		await expect(
			page
				.getByRole('navigation')
				.getByRole('link', { name: 'App Settings', exact: true }),
		).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))

		const disabledNavLinks = page
			.getByRole('navigation')
			.getByRole('link', { disabled: true })

		await expect(disabledNavLinks.first()).toHaveAccessibleName('View project.')

		await expect(disabledNavLinks).toHaveText([
			'',
			'Exchange',
			'Data & Privacy',
			'About CoMapeo',
		])

		// Main
		await expect(
			main.getByRole('heading', { name: 'Device Name', exact: true }),
		).toBeVisible()

		const deviceNameInput = main.getByRole('textbox', {
			name: 'Device Name',
			exact: true,
		})

		//// Input (initial state)
		await expect(deviceNameInput).toHaveValue(onboardingOutputs.deviceName)

		await expect(main.locator('output[name="character-count"]')).toHaveText(
			`${onboardingOutputs.deviceName.length}/60`,
		)

		//// Input (invalid state, too long)
		const invalidDeviceName = Array(100).fill('a').join('')

		await deviceNameInput.fill(invalidDeviceName)

		await expect(
			page.getByText('Too long, try a shorter name.', { exact: true }),
		).toBeVisible()

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			`${invalidDeviceName.length}/60`,
		)

		const currentUrl = page.url()

		await main
			.getByRole('button', { name: 'Save', exact: true })
			.click({ force: true })

		expect(page.url()).toStrictEqual(currentUrl)

		//// Input (invalid state, empty)
		await deviceNameInput.fill('')

		await expect(
			page.getByText('Enter a Device Name', { exact: true }),
		).toBeVisible()

		await expect(page.locator('output[name="character-count"]')).toHaveText(
			'0/60',
		)

		//// Restoration of input initial state when navigating away without saving
		await main.getByRole('button', { name: 'Go back.', exact: true }).click()

		await page
			.getByRole('link', { name: 'Go to device name settings.', exact: true })
			.click()

		await expect(deviceNameInput).toHaveValue(onboardingOutputs.deviceName)

		await main.getByRole('button', { name: 'Cancel', exact: true }).click()

		await page
			.getByRole('link', { name: 'Go to device name settings.', exact: true })
			.click()

		await expect(deviceNameInput).toHaveValue(onboardingOutputs.deviceName)

		//// Saving updated device name
		await deviceNameInput.fill(OUTPUTS.deviceName)

		await main
			.getByRole('button', {
				name: 'Save',
				exact: true,
			})
			.click()

		await expect(
			main.getByRole('link', {
				name: 'Go to device name settings.',
				exact: true,
			}),
		).toHaveText(`${OUTPUTS.deviceName}Edit`)
	})

	test('language', async () => {
		const page = await electronApp.firstWindow()

		const main = page.getByRole('main')

		{
			const languageSettingsLink = main.getByRole('link', {
				name: 'Go to language settings.',
				exact: true,
			})

			await expect(languageSettingsLink).toHaveText(
				// TODO: The result of this will vary based on system language preferences.
				/^English.*/,
			)

			await languageSettingsLink.click()
		}

		// Navigation
		{
			await expect(
				page
					.getByRole('navigation')
					.getByRole('link', { name: 'App Settings', exact: true }),
			).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))

			const disabledNavLinks = page
				.getByRole('navigation')
				.getByRole('link', { disabled: true })

			await expect(disabledNavLinks.first()).toHaveAccessibleName(
				'View project.',
			)

			await expect(disabledNavLinks).toHaveText([
				'',
				'Exchange',
				'Data & Privacy',
				'About CoMapeo',
			])
		}

		// Main
		await expect(
			main.getByRole('heading', { name: 'Language', exact: true }),
		).toBeVisible()

		//// Initial state
		{
			const systemPreferencesOption = main.getByRole('radio', {
				name: 'Follow system preferences',
				exact: true,
				checked: true,
			})

			await expect(systemPreferencesOption).toHaveValue('system')

			const allLanguages = (
				await import('../languages.json', {
					with: { type: 'json' },
				})
			).default

			const translatedLanguages = (
				await import(
					'../src/renderer/src/generated/translated-languages.generated.json',
					{ with: { type: 'json' } }
				)
			).default

			for (const languageCode of translatedLanguages) {
				const { nativeName, englishName } =
					allLanguages[languageCode as keyof typeof allLanguages]!

				const option = main.getByRole('radio', {
					name: `${nativeName} ${englishName}`,
				})

				await expect(option).toHaveValue(languageCode)
				await expect(option).not.toBeChecked()
			}
		}

		//// Updating selected value
		{
			const portugueseOption = main.getByRole('radio', { name: 'Portuguese' })
			// NOTE: Using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) is sometimes flaky in CI
			await portugueseOption.click()
			await expect(portugueseOption).toBeChecked()

			await expect(
				main.getByRole('heading', { name: 'Idioma', exact: true }),
			).toBeVisible()

			await expect(
				main.getByRole('radio', {
					name: 'Seguir preferências do sistema',
					exact: true,
				}),
			).toBeVisible()

			await expect(page.getByRole('navigation').getByRole('link')).toHaveText([
				'',
				'Trocar',
				'Configurações do Aplicativo',
				'Dados & Privacidade',
				'Sobre o CoMapeo',
			])

			await main.getByRole('button', { name: 'Voltar.', exact: true }).click()

			const languageSettingsLink = main.getByRole('link', {
				name: 'Vá para as configurações de idioma.',
				exact: true,
			})

			await expect(languageSettingsLink).toHaveText('Português')

			await languageSettingsLink.click()
		}

		//// Returning to language settings page and restoring selection
		{
			await expect(
				main.getByRole('radio', { name: 'Portuguese', checked: true }),
			).toBeVisible()

			const systemPreferencesOption = main.getByRole('radio', {
				name: 'Seguir preferências do sistema',
				exact: true,
			})
			// NOTE: Using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) is sometimes flaky in CI
			await expect(systemPreferencesOption).not.toBeChecked()
			await systemPreferencesOption.click()
			await expect(systemPreferencesOption).toBeChecked()

			await main.getByRole('button', { name: 'Go back.', exact: true }).click()
		}
	})

	test('coordinate system', async () => {
		const page = await electronApp.firstWindow()

		const main = page.getByRole('main')

		{
			const coordinateSystemSettingsLink = main.getByRole('link', {
				name: 'Go to coordinate system settings.',
				exact: true,
			})

			await expect(coordinateSystemSettingsLink).toHaveText('UTM Coordinates')

			await coordinateSystemSettingsLink.click()
		}

		// Navigation
		{
			await expect(
				page
					.getByRole('navigation')
					.getByRole('link', { name: 'App Settings', exact: true }),
			).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))

			const disabledNavLinks = page
				.getByRole('navigation')
				.getByRole('link', { disabled: true })

			await expect(disabledNavLinks.first()).toHaveAccessibleName(
				'View project.',
			)

			await expect(disabledNavLinks).toHaveText([
				'',
				'Exchange',
				'Data & Privacy',
				'About CoMapeo',
			])
		}

		// Main
		{
			const pageTitle = main.getByRole('heading', {
				name: 'Coordinate System',
				exact: true,
			})

			await expect(pageTitle).toBeVisible()
			await expect(pageTitle).toHaveId('coordinate-system-selection-label')
		}

		//// Initial state
		{
			const radioGroup = main.getByRole('radiogroup')
			await expect(radioGroup).toHaveAttribute(
				'aria-labelledby',
				'coordinate-system-selection-label',
			)
			await expect(radioGroup).toHaveAccessibleName('Coordinate System')

			const utmOption = main.getByRole('radio', {
				name: 'UTM (Universal Transverse Mercator)',
				exact: true,
				checked: true,
			})
			await expect(utmOption).toHaveValue('utm')

			const uncheckedOptions = main.getByRole('radio', { checked: false })
			await expect(uncheckedOptions).toHaveCount(2)
			await expect(uncheckedOptions.first()).toHaveAccessibleName(
				'DD (Decimal Degrees)',
			)
			await expect(uncheckedOptions.first()).toHaveValue('dd')
			await expect(uncheckedOptions.last()).toHaveAccessibleName(
				'DMS (Decimal/Minutes/Seconds)',
			)
			await expect(uncheckedOptions.last()).toHaveValue('dms')
		}

		//// Updating selected value
		{
			const ddOption = main.getByRole('radio', {
				name: 'DD (Decimal Degrees)',
				exact: true,
			})
			// NOTE: Using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) is sometimes flaky in CI
			await ddOption.click()
			await expect(ddOption).toBeChecked()

			await main.getByRole('button', { name: 'Go back.', exact: true }).click()

			const coordinateSystemSettingsLink = main.getByRole('link', {
				name: 'Go to coordinate system settings.',
				exact: true,
			})
			await expect(coordinateSystemSettingsLink).toHaveText('DD Coordinates')
			await coordinateSystemSettingsLink.click()
		}

		//// Return to coordinate system settings page and restore selection
		{
			await expect(
				main.getByRole('radio', {
					name: 'DD (Decimal Degrees)',
					exact: true,
					checked: true,
				}),
			).toBeVisible()

			const utmOption = main.getByRole('radio', {
				name: 'UTM (Universal Transverse Mercator)',
				exact: true,
			})
			// NOTE: Using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) is sometimes flaky in CI
			await utmOption.click()
			await expect(utmOption).toBeChecked()

			await main.getByRole('button', { name: 'Go back.', exact: true }).click()
		}
	})

	test('background map', async () => {
		const page = await electronApp.firstWindow()

		const main = page.getByRole('main')

		{
			const backgroundMapSettingsLink = main.getByRole('link', {
				name: 'Go to background map settings.',
				exact: true,
			})

			await expect(backgroundMapSettingsLink).toHaveText('Default Background')

			await backgroundMapSettingsLink.click()
		}

		// Navigation
		{
			await expect(
				page
					.getByRole('navigation')
					.getByRole('link', { name: 'App Settings', exact: true }),
			).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))
		}

		// Main
		await expect(
			main.getByRole('heading', { name: 'Background Map', exact: true }),
		).toBeVisible()

		await expect(
			main.getByText(
				'Custom background maps are viewable offline and only on this device.',
				{ exact: true },
			),
		).toBeVisible()

		await expect(
			main.getByText('Accepted file types are .smp', { exact: true }),
		).toBeVisible()

		//// Choose file (cancelled)
		{
			const chooseFileButton = main.getByRole('button', {
				name: 'Choose File',
				exact: true,
			})

			await stubDialog(electronApp, 'showOpenDialog', {
				canceled: true,
				filePaths: [],
			})

			await chooseFileButton.click()

			await expect(page.getByRole('dialog')).not.toBeVisible()
		}

		//// Choose file (bad file)
		{
			const chooseFileButton = main.getByRole('button', {
				name: 'Choose File',
				exact: true,
			})

			await stubDialog(electronApp, 'showOpenDialog', {
				canceled: false,
				filePaths: [
					fileURLToPath(new URL('./assets/bad-map.smp', import.meta.url)),
				],
			})

			await chooseFileButton.click()

			const dialog = page.getByRole('dialog')
			await expect(
				dialog.getByRole('heading', { name: 'Updated!', exact: true }),
			).toBeVisible()
			await expect(
				dialog.getByText('CoMapeo is now using the latest background map.'),
			).toBeVisible()
			await dialog.getByRole('button', { name: 'Close', exact: true }).click()
			await expect(dialog).not.toBeVisible()

			await expect(
				main.getByText(
					'Could not get custom map information from file. Please remove it or choose a different file.',
				),
			).toBeVisible()

			const removeMapButton = main.getByRole('button', {
				name: 'Remove Map',
				exact: true,
			})
			await expect(removeMapButton).toBeVisible()

			await main.getByRole('button', { name: 'Go back.', exact: true }).click()

			const backgroundMapSettingsLink = main.getByRole('link', {
				name: 'Go to background map settings.',
				exact: true,
			})
			await expect(backgroundMapSettingsLink).toHaveText('Custom Background')
			await backgroundMapSettingsLink.click()

			await removeMapButton.click()
			await expect(
				main.getByText(
					'Could not get custom map information from file. Please remove it or choose a different file.',
				),
			).not.toBeVisible()
			await expect(removeMapButton).not.toBeVisible()
		}

		//// Choose file (good file)
		{
			await stubDialog(electronApp, 'showOpenDialog', {
				canceled: false,
				filePaths: [
					fileURLToPath(
						new URL('./assets/maplibre-demotiles.smp', import.meta.url),
					),
				],
			})

			await main
				.getByRole('button', { name: 'Choose File', exact: true })
				.click()

			const dialog = page.getByRole('dialog')
			await expect(
				dialog.getByRole('heading', { name: 'Updated!', exact: true }),
			).toBeVisible()
			await expect(
				dialog.getByText('CoMapeo is now using the latest background map.'),
			).toBeVisible()
			await dialog.getByRole('button', { name: 'Close', exact: true }).click()
			await expect(dialog).not.toBeVisible()

			await expect(
				main.getByRole('button', {
					name: 'Choose File',
					exact: true,
				}),
			).not.toBeVisible()

			await expect(main.getByText('Map Name')).toBeVisible()
			await expect(main.getByText('Date Added')).toBeVisible()

			await expect(main.getByText('MapLibre')).toBeVisible()
			await expect(main.getByText(/^\d MB$/)).toBeVisible()

			// TODO: Ideally check for the actual values
			const addedAt = main.getByRole('time')
			await expect(addedAt).not.toBeEmpty()
			await expect(addedAt).toHaveAttribute('datetime')

			await expect(
				main.getByRole('button', { name: 'Remove Map', exact: true }),
			).toBeVisible()

			await main.getByRole('button', { name: 'Go back.', exact: true }).click()

			const backgroundMapSettingsLink = main.getByRole('link', {
				name: 'Go to background map settings.',
				exact: true,
			})
			await expect(backgroundMapSettingsLink).toHaveText('MapLibre')
			await backgroundMapSettingsLink.click()
		}

		// Remove file
		{
			await main
				.getByRole('button', { name: 'Remove Map', exact: true })
				.click()

			await expect(
				main.getByRole('button', { name: 'Choose File', exact: true }),
			).toBeVisible()
			await expect(
				main.getByText('Accepted file types are .smp', { exact: true }),
			).toBeVisible()

			await main.getByRole('button', { name: 'Go back.', exact: true }).click()
			await expect(
				main.getByRole('link', {
					name: 'Go to background map settings.',
					exact: true,
				}),
			).toHaveText('Default Background')
		}
	})
})

test.describe('exchange', () => {
	test('solo ', async () => {
		const page = await electronApp.firstWindow()

		await page
			.getByRole('navigation')
			.getByText('Exchange', { exact: true })
			.click()

		// Navigation
		await expect(
			page
				.getByRole('navigation')
				.getByRole('link', { name: 'Exchange', exact: true }),
		).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))

		const main = page.getByRole('main')

		// Main

		//// Initial state
		{
			const networkConnectionInfo = main.getByTestId(
				'exchange-network-connection-info',
			)
			await expect(networkConnectionInfo).toHaveText(
				'Getting Wi-Fi information…',
				{ timeout: 0 },
			)
			await expect(networkConnectionInfo).not.toHaveText(
				'Getting Wi-Fi information…',
				{ timeout: 10_000 },
			)
			// TODO: Ideally check for actual values
			await expect(networkConnectionInfo).not.toBeEmpty()
			await expect(networkConnectionInfo).not.toHaveText('&lt;redacted&gt;')

			await expect(
				main.getByRole('heading', { name: 'No Devices Found', exact: true }),
			).toBeVisible()

			await expect(main.getByRole('progressbar')).not.toBeVisible()

			// TODO: Will need to update when exchange settings can be configured
			await expect(
				main.getByText('Exchange everything.', { exact: true }),
			).toBeVisible()
			await expect(main.getByText('Full size photos and audio.')).toBeVisible()
			await expect(main.getByText('Uses more storage.')).toBeVisible()
		}

		//// Start exchange
		{
			const startButton = main.getByRole('button', {
				name: 'Start',
				exact: true,
			})
			await expect(startButton).toBeVisible()
			await startButton.click()

			const disabledNavLinks = page
				.getByRole('navigation')
				.getByRole('link', { disabled: true })

			await expect(disabledNavLinks.first()).toHaveAccessibleName(
				'View project.',
			)

			await expect(disabledNavLinks).toHaveText([
				'',
				'App Settings',
				'Data & Privacy',
				'About CoMapeo',
			])

			await expect(
				main.getByRole('heading', { name: 'Waiting for Devices', exact: true }),
			).toBeVisible()

			await expect(main.getByRole('progressbar')).toBeVisible()

			await expect(main.getByText(/^\d%$/)).toBeVisible()
		}

		//// Stop exchange
		{
			const stopButton = main.getByRole('button', { name: 'Stop', exact: true })
			await expect(stopButton).toBeVisible()
			await stopButton.click()

			const disabledNavLinks = page
				.getByRole('navigation')
				.getByRole('link', { disabled: true })

			await expect(disabledNavLinks).toHaveCount(0)
		}
	})
})

test.describe('project settings', () => {
	test('index', async () => {
		const page = await electronApp.firstWindow()

		const main = page.getByRole('main')

		// Navigation
		{
			const projectNavLink = page
				.getByRole('navigation')
				.getByRole('link', { name: 'View project.', exact: true })

			await projectNavLink.click()

			await expect(projectNavLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))

			await main.getByRole('link', { name: 'View', exact: true }).click()

			await main.getByRole('button', { name: 'Go back.', exact: true }).click()

			await main.getByRole('link', { name: 'View', exact: true }).click()

			await expect(projectNavLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))
		}

		// Main
		{
			await expect(
				main.getByRole('heading', { name: 'Project Settings', exact: true }),
			).toBeVisible()

			const settingsItems = main.getByRole('listitem')

			await expect(settingsItems).toHaveCount(3)

			//// Project info settings item
			const projectInfoItem = settingsItems.first()

			await expect(
				projectInfoItem.getByRole('heading', {
					name: onboardingOutputs.projectName,
					exact: true,
				}),
			).toBeVisible()
			await expect(
				projectInfoItem.getByRole('link', {
					name: 'Edit Info',
					exact: true,
				}),
			).toBeVisible()

			//// Collaborators settings item
			const collaboratorsItem = settingsItems.nth(1)

			await expect(
				collaboratorsItem.getByRole('heading', {
					name: 'Collaborators',
					exact: true,
				}),
			).toBeVisible()
			await expect(
				collaboratorsItem.getByText(
					'This device is a coordinator on this project.',
				),
			).toBeVisible()
			await expect(
				collaboratorsItem.getByRole('link', {
					name: 'View Team',
					exact: true,
				}),
			).toBeVisible()

			//// Categories set settings item
			const categoriesSetItem = settingsItems.last()

			await expect(
				categoriesSetItem.getByRole('heading', {
					name: 'Categories Set',
					exact: true,
				}),
			).toBeVisible()
			await expect(
				categoriesSetItem.getByText('CoMapeo Default Categories'),
			).toBeVisible()
			await expect(
				categoriesSetItem.getByRole('link', {
					name: 'Update Set',
					exact: true,
				}),
			).toBeVisible()
		}
	})

	test('project info', async () => {
		const page = await electronApp.firstWindow()

		const main = page.getByRole('main')

		await main.getByRole('link', { name: 'Edit Info', exact: true }).click()

		// Navigation
		{
			await expect(
				page.getByRole('navigation').getByRole('link', {
					name: 'View project.',
					exact: true,
					disabled: false,
				}),
			).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))

			const disabledNavLinks = page
				.getByRole('navigation')
				.getByRole('link', { disabled: true })

			await expect(disabledNavLinks).toHaveCount(4)
			await expect(disabledNavLinks).toHaveText([
				'Exchange',
				'App Settings',
				'Data & Privacy',
				'About CoMapeo',
			])
		}

		// Main
		await expect(
			main.getByRole('heading', { name: 'Edit Info', exact: true }),
		).toBeVisible()

		//// Initial state
		{
			const projectNameInput = main.getByRole('textbox', {
				name: 'Project Name',
				exact: true,
			})

			await expect(projectNameInput).toBeVisible()
			await expect(projectNameInput).toHaveValue(onboardingOutputs.projectName)

			const projectDescriptionInput = main.getByRole('textbox', {
				name: 'Project Description',
				exact: true,
			})

			await expect(projectDescriptionInput).toBeVisible()
			await expect(projectDescriptionInput).toHaveValue('')

			// Project color
			{
				const projectColorInput = main.getByLabel('Project Card Color', {
					exact: true,
				})

				await expect(projectColorInput).toBeVisible()

				await expect(
					projectColorInput.getByRole('checkbox', { checked: true }),
				).toHaveCount(0)
				const colorCheckboxes = projectColorInput.getByRole('checkbox')

				const expectedColorOptions = [
					{ name: 'Orange', hexCode: PROJECT_ORANGE },
					{ name: 'Blue', hexCode: PROJECT_BLUE },
					{ name: 'Green', hexCode: PROJECT_GREEN },
					{ name: 'Red', hexCode: PROJECT_RED },
					{ name: 'Grey', hexCode: PROJECT_GREY },
				]

				await expect(colorCheckboxes).toHaveCount(expectedColorOptions.length)

				for (const [
					index,
					{ name, hexCode },
				] of expectedColorOptions.entries()) {
					const checkbox = colorCheckboxes.nth(index)
					await expect(checkbox).toHaveAccessibleName(name)
					await expect(checkbox).toHaveAttribute('value', hexCode)
					await expect(checkbox).toHaveAttribute(
						'name',
						`option-${name.toLowerCase()}`,
					)
				}
			}

			await expect(
				main.getByRole('button', { name: 'Cancel', exact: true }),
			).toBeVisible()
			await expect(
				main.getByRole('button', { name: 'Save', exact: true }),
			).toBeVisible()
		}

		await main.getByRole('button', { name: 'Go back.', exact: true }).click()
		await main.getByRole('link', { name: 'Edit Info', exact: true }).click()

		//// Cancel changes (back button)
		{
			// Update inputs
			await main
				.getByRole('textbox', {
					name: 'Project Name',
					exact: true,
				})
				.fill('Name in back button test')

			await main
				.getByRole('textbox', {
					name: 'Project Description',
					exact: true,
				})
				.fill('Description in back button test')

			// NOTE: Using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) is sometimes flaky in CI
			await main
				.getByLabel('Project Card Color', { exact: true })
				.getByRole('checkbox', { name: 'Green', exact: true })
				.click()
			await expect(
				main
					.getByLabel('Project Card Color', { exact: true })
					.getByRole('checkbox', { name: 'Green', exact: true }),
			).toBeChecked()

			// Leave and re-enter using back button
			await main.getByRole('button', { name: 'Go back.', exact: true }).click()
			await main.getByRole('link', { name: 'Edit Info', exact: true }).click()

			// Assert inputs state
			const projectNameInput = main.getByRole('textbox', {
				name: 'Project Name',
				exact: true,
			})

			await expect(projectNameInput).toBeVisible()
			await expect(projectNameInput).toHaveValue(onboardingOutputs.projectName)

			const projectDescriptionInput = main.getByRole('textbox', {
				name: 'Project Description',
				exact: true,
			})

			await expect(projectDescriptionInput).toBeVisible()
			await expect(projectDescriptionInput).toHaveValue('')

			const projectColorInput = main.getByLabel('Project Card Color', {
				exact: true,
			})

			await expect(projectColorInput).toBeVisible()

			await expect(
				projectColorInput.getByRole('checkbox', { checked: true }),
			).toHaveCount(0)
		}

		//// Cancel changes (cancel button)
		{
			// Update inputs
			await main
				.getByRole('textbox', {
					name: 'Project Name',
					exact: true,
				})
				.fill('Name in cancel button test')

			await main
				.getByRole('textbox', {
					name: 'Project Description',
					exact: true,
				})
				.fill('Description in cancel button test')

			// NOTE: Using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) is sometimes flaky in CI
			await main
				.getByLabel('Project Card Color', { exact: true })
				.getByRole('checkbox', { name: 'Blue', exact: true })
				.click()
			await expect(
				main
					.getByLabel('Project Card Color', { exact: true })
					.getByRole('checkbox', {
						name: 'Blue',
						exact: true,
					}),
			).toBeChecked()

			// Leave using cancel button and re-enter
			await main.getByRole('button', { name: 'Cancel', exact: true }).click()
			await main.getByRole('link', { name: 'Edit Info', exact: true }).click()

			// Assert inputs state
			const projectNameInput = main.getByRole('textbox', {
				name: 'Project Name',
				exact: true,
			})

			await expect(projectNameInput).toBeVisible()
			await expect(projectNameInput).toHaveValue(onboardingOutputs.projectName)

			const projectDescriptionInput = main.getByRole('textbox', {
				name: 'Project Description',
				exact: true,
			})

			await expect(projectDescriptionInput).toBeVisible()
			await expect(projectDescriptionInput).toHaveValue('')

			const projectColorInput = main.getByLabel('Project Card Color', {
				exact: true,
			})

			await expect(projectColorInput).toBeVisible()

			await expect(
				projectColorInput.getByRole('checkbox', { checked: true }),
			).toHaveCount(0)

			await expect(
				main.getByRole('button', { name: 'Cancel', exact: true }),
			).toBeVisible()
			await expect(
				main.getByRole('button', { name: 'Save', exact: true }),
			).toBeVisible()
		}

		//// Input validation

		//// Project name
		{
			// Too long
			const projectNameInput = main.getByRole('textbox', {
				name: 'Project Name',
				exact: true,
			})

			const invalidProjectName = Array(101).fill('a').join('')

			await projectNameInput.fill(invalidProjectName)

			await expect(
				main.getByText('Too long, try a shorter name.', { exact: true }),
			).toBeVisible()

			await expect(
				main.locator('output[for="projectName"][name="character-count"]'),
			).toHaveText(`${invalidProjectName.length}/100`)

			{
				// Save button does nothing
				const currentUrl = page.url()

				await main
					.getByRole('button', { name: 'Save', exact: true })
					.click({ force: true })

				expect(page.url()).toStrictEqual(currentUrl)
			}

			// Too short
			await projectNameInput.clear()

			await expect(
				main.getByText('Enter a Project Name', { exact: true }),
			).toBeVisible()

			await expect(
				main.locator('output[for="projectName"][name="character-count"]'),
			).toHaveText('0/100')

			await main
				.getByRole('button', { name: 'Save', exact: true })
				.click({ force: true })

			{
				// Save button does nothing
				const currentUrl = page.url()

				await main
					.getByRole('button', { name: 'Save', exact: true })
					.click({ force: true })

				expect(page.url()).toStrictEqual(currentUrl)
			}
		}

		//// Project description
		{
			const projectDescriptionInput = main.getByRole('textbox', {
				name: 'Project Description',
				exact: true,
			})

			const invalidProjectName = Array(61).fill('a').join('')

			await projectDescriptionInput.fill(invalidProjectName)

			// Too long
			await expect(
				main.getByText('Too long, try a shorter description.', { exact: true }),
			).toBeVisible()

			await expect(
				main.locator(
					'output[for="projectDescription"][name="character-count"]',
				),
			).toHaveText(`${invalidProjectName.length}/60`)

			// Save button does nothing
			const currentUrl = page.url()

			await main
				.getByRole('button', { name: 'Save', exact: true })
				.click({ force: true })

			expect(page.url()).toStrictEqual(currentUrl)
		}

		await main.getByRole('button', { name: 'Go back.', exact: true }).click()
		await main.getByRole('link', { name: 'Edit Info', exact: true }).click()

		//// Updating and saving project info
		{
			await main
				.getByRole('textbox', {
					name: 'Project Name',
					exact: true,
				})
				.fill(OUTPUTS.projectName)

			main
				.getByRole('textbox', {
					name: 'Project Description',
					exact: true,
				})
				.fill(OUTPUTS.projectDescription)

			// NOTE: Using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) is sometimes flaky in CI
			await main
				.getByLabel('Project Card Color', { exact: true })
				.getByRole('checkbox', { name: OUTPUTS.projectColor.name, exact: true })
				.click()
			await expect(
				main
					.getByLabel('Project Card Color', { exact: true })
					.getByRole('checkbox', {
						name: OUTPUTS.projectColor.name,
						exact: true,
					}),
			).toBeChecked()

			main.getByRole('button', { name: 'Save', exact: true }).click()

			// Check relevant changes are reflected in project settings index page
			{
				const projectInfoItem = main.getByRole('listitem').first()

				await expect(
					projectInfoItem.getByRole('heading', {
						name: OUTPUTS.projectName,
						exact: true,
					}),
				).toBeVisible()

				await expect(
					projectInfoItem.getByText(OUTPUTS.projectDescription, {
						exact: true,
					}),
				).toBeVisible()

				await projectInfoItem
					.getByRole('link', {
						name: 'Edit Info',
						exact: true,
					})
					.click()
			}

			// Check changes are present when re-entering project info settings page
			{
				const projectNameInput = main.getByRole('textbox', {
					name: 'Project Name',
					exact: true,
				})

				await expect(projectNameInput).toHaveValue(OUTPUTS.projectName)

				const projectDescriptionInput = main.getByRole('textbox', {
					name: 'Project Description',
					exact: true,
				})

				await expect(projectDescriptionInput).toHaveValue(
					OUTPUTS.projectDescription,
				)

				await expect(
					main
						.getByLabel('Project Card Color', {
							exact: true,
						})
						.getByRole('checkbox', {
							name: OUTPUTS.projectColor.name,
							exact: true,
							checked: true,
						}),
				).toBeVisible()

				await main
					.getByRole('button', { name: 'Go back.', exact: true })
					.click()
			}
		}
	})

	test('categories', async () => {
		const page = await electronApp.firstWindow()

		const main = page.getByRole('main')

		await main.getByRole('link', { name: 'Update Set', exact: true }).click()

		// Navigation
		{
			const navLinks = page
				.getByRole('navigation')
				.getByRole('link', { disabled: false })

			await expect(navLinks.first()).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))
			await expect(navLinks.first()).toHaveAccessibleName('View project.')

			await expect(navLinks).toHaveText([
				'',
				'Exchange',
				'App Settings',
				'Data & Privacy',
				'About CoMapeo',
			])
		}

		// Main
		await expect(
			main.getByRole('heading', { name: 'Categories Set', exact: true }),
		).toBeVisible()

		//// Initial state
		{
			await expect(
				main.getByRole('heading', {
					name: 'CoMapeo Default Categories',
					exact: true,
				}),
			).toBeVisible()

			// TODO: Ideally check for the actual values
			await expect(main.getByText(/^Added .+/)).toBeVisible()
			const addedAt = main.getByRole('time')
			await expect(addedAt).not.toBeEmpty()
			await expect(addedAt).toHaveAttribute('datetime')

			await expect(
				main.getByRole('button', { name: 'Upload New Set', exact: true }),
			).toBeVisible()
		}

		//// Choose file (cancelled)
		{
			await stubDialog(electronApp, 'showOpenDialog', {
				canceled: true,
				filePaths: [],
			})

			await main
				.getByRole('button', { name: 'Upload New Set', exact: true })
				.click()

			await expect(page.getByRole('dialog')).not.toBeVisible()
		}

		//// Choose file (bad file)
		{
			await stubDialog(electronApp, 'showOpenDialog', {
				canceled: false,
				filePaths: [
					fileURLToPath(
						new URL(
							'./assets/bad-categories-archive.comapeocat',
							import.meta.url,
						),
					),
				],
			})

			await main
				.getByRole('button', { name: 'Upload New Set', exact: true })
				.click()

			const dialog = page.getByRole('dialog')

			await expect(
				dialog.getByRole('heading', {
					name: 'Something Went Wrong',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				dialog.getByRole('button', { name: 'Advanced', exact: true }),
			).toBeVisible()

			await dialog.getByRole('button', { name: 'Close', exact: true }).click()

			await expect(dialog).not.toBeVisible()
		}

		//// Choose file (good file)
		// TODO: Confirm that categories are being used in app
		{
			await stubDialog(electronApp, 'showOpenDialog', {
				canceled: false,
				filePaths: [
					fileURLToPath(
						new URL(
							'./assets/good-categories-archive.comapeocat',
							import.meta.url,
						),
					),
				],
			})

			await main
				.getByRole('button', { name: 'Upload New Set', exact: true })
				.click()

			await expect(
				main.getByRole('heading', { name: 'Test Categories', exact: true }),
			).toBeVisible()

			await expect(main.getByText(/^Added .+/)).toBeVisible()

			// TODO: Ideally check for the actual values
			const addedAt = main.getByRole('time')
			await expect(addedAt).not.toBeEmpty()
			await expect(addedAt).toHaveAttribute('datetime')

			// Check relevant changes are reflected in project settings index page
			{
				await main
					.getByRole('button', { name: 'Go back.', exact: true })
					.click()

				const categoriesSetItem = main.getByRole('listitem').last()

				await expect(
					categoriesSetItem.getByText('Test Categories', { exact: true }),
				).toBeVisible()

				await categoriesSetItem
					.getByRole('link', {
						name: 'Update Set',
						exact: true,
					})
					.click()
			}
		}

		//// Update file (restore default categories)
		// TODO: Confirm that categories are being used in app
		{
			await stubDialog(electronApp, 'showOpenDialog', {
				canceled: false,
				filePaths: [
					createRequire(import.meta.url).resolve('@comapeo/default-categories'),
				],
			})

			await main
				.getByRole('button', { name: 'Upload New Set', exact: true })
				.click()

			await expect(
				main.getByRole('heading', {
					name: 'CoMapeo Default Categories',
					exact: true,
				}),
			).toBeVisible()

			// TODO: Ideally check for the actual values
			await expect(main.getByText(/^Added .+/)).toBeVisible()
			const addedAt = main.getByRole('time')
			await expect(addedAt).not.toBeEmpty()
			await expect(addedAt).toHaveAttribute('datetime')

			// Check relevant changes are reflected in project settings index page
			{
				await main
					.getByRole('button', { name: 'Go back.', exact: true })
					.click()

				const categoriesSetItem = main.getByRole('listitem').last()

				await expect(
					categoriesSetItem.getByText('CoMapeo Default Categories', {
						exact: true,
					}),
				).toBeVisible()
			}
		}
	})
})

test('write outputs', async () => {
	await writeOutputsFile('app', OUTPUTS)
})
