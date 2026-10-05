import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from '@playwright/test'

import {
	setup,
	simulateCreateProject,
	simulateOnboarding,
	test,
} from '../utils.ts'

const ASSETS_DIR = fileURLToPath(new URL('../../assets', import.meta.url))

test.describe.configure({ mode: 'parallel' })

test('index', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
		})

		// 2. Main tests

		/// Navigation
		{
			const settingsNavLink = page.getByRole('link', {
				name: 'CoMapeo Settings',
				exact: true,
			})

			await settingsNavLink.click()
		}

		const main = page.getByRole('main')

		/// Header
		{
			const header = main.locator('header')

			await expect(
				header.getByRole('heading', { name: 'CoMapeo Settings', exact: true }),
			).toBeVisible()
		}

		/// Settings sections
		{
			const settingsSections = main
				.locator('section')
				.filter({ has: page.locator('h2') })

			await expect(settingsSections).toHaveCount(6)

			await expect(
				settingsSections
					.nth(0)
					.getByRole('heading', { name: 'Device Name', exact: true }),
			).toBeVisible()

			await expect(
				settingsSections
					.nth(1)
					.getByRole('heading', { name: 'Language', exact: true }),
			).toBeVisible()

			await expect(
				settingsSections
					.nth(2)
					.getByRole('heading', { name: 'Coordinate System', exact: true }),
			).toBeVisible()

			await expect(
				settingsSections
					.nth(3)
					.getByRole('heading', { name: 'Unit System', exact: true }),
			).toBeVisible()

			await expect(
				settingsSections.nth(4).getByRole('heading', {
					name: 'CoMapeo respects your privacy and autonomy',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				settingsSections
					.nth(5)
					.getByRole('heading', { name: 'About CoMapeo', exact: true }),
			).toBeVisible()

			/// About CoMapeo section
			{
				await expect(
					main.getByRole('heading', { name: 'About CoMapeo', exact: true }),
				).toBeVisible()

				await expect(
					main.getByRole('heading', { name: 'CoMapeo Version', exact: true }),
				).toBeVisible()
			}
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('device name', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
		})

		await page
			.getByRole('link', { name: 'CoMapeo Settings', exact: true })
			.click()

		// 2. Main tests
		const main = page.getByRole('main')

		const deviceNameSection = main.locator('section').filter({
			has: page.getByRole('heading', { name: 'Device Name', exact: true }),
		})

		const deviceNameInput = deviceNameSection.getByRole('textbox', {
			name: 'Device Name',
			exact: true,
		})

		/// Input (initial state)
		{
			await expect(deviceNameInput).toHaveAttribute('readonly')

			await expect(
				deviceNameSection.getByText('Edit', { exact: true }),
			).toBeVisible()

			await expect(deviceNameInput).toHaveValue(userParams.deviceName)
		}

		// Start editing via mouse interaction
		await deviceNameInput.click()

		/// Input (initial edit state)
		{
			await expect(deviceNameInput).not.toHaveAttribute('readonly')

			await expect(deviceNameInput).toHaveValue(userParams.deviceName)

			await expect(
				deviceNameSection.getByText('Edit', { exact: true }),
			).not.toBeVisible()

			await expect(
				deviceNameSection.locator('output[name="character-count"]'),
			).toHaveText(`${userParams.deviceName.length}/60`)

			await expect(
				deviceNameSection.getByRole('button', { name: 'Save', exact: true }),
			).toBeVisible()

			await expect(
				deviceNameSection.getByRole('button', { name: 'Cancel', exact: true }),
			).toBeVisible()
		}

		/// Input (invalid state, too long)
		{
			const invalidDeviceName = Array(100).fill('a').join('')

			await deviceNameInput.fill(invalidDeviceName)

			await expect(
				deviceNameSection.getByText('Too long, try a shorter name.', {
					exact: true,
				}),
			).toBeVisible()

			await expect(
				deviceNameSection.locator('output[name="character-count"]'),
			).toHaveText(`${invalidDeviceName.length}/60`)

			await main
				.getByRole('button', { name: 'Save', exact: true })
				.click({ force: true })
		}

		/// Input (invalid state, empty)
		{
			await deviceNameInput.fill('')

			await expect(
				deviceNameSection.getByText('Enter a Device Name', { exact: true }),
			).toBeVisible()

			await expect(
				deviceNameSection.locator('output[name="character-count"]'),
			).toHaveText('0/60')
		}

		/// Restoration of input initial state when navigating away without saving
		{
			//  Clicking external navigation control
			await main
				.locator('header')
				.getByRole('button', { name: 'Go back.', exact: true })
				.click()

			const discardEditsDialog = page.getByRole('dialog')

			await expect(
				discardEditsDialog.getByRole('heading', {
					name: 'Discard Edits?',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				discardEditsDialog.getByRole('button', {
					name: 'Cancel',
					exact: true,
				}),
			).toBeVisible()

			await discardEditsDialog
				.getByRole('button', { name: 'Yes, Discard', exact: true })
				.click()

			await page
				.getByRole('link', { name: 'CoMapeo Settings', exact: true })
				.click()

			await expect(deviceNameInput).toHaveValue(userParams.deviceName)
		}

		// Start editing via keyboard interaction
		await deviceNameInput.focus()
		await page.keyboard.press('Enter')

		/// Saving updated device name
		{
			const updatedUserParams = { deviceName: 'Desktop e2e Updated' }

			await deviceNameInput.fill(updatedUserParams.deviceName)

			await deviceNameSection
				.getByRole('button', { name: 'Save', exact: true })
				.click()

			await expect(deviceNameInput).toHaveValue(updatedUserParams.deviceName)
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('language', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
		})

		await page
			.getByRole('link', { name: 'CoMapeo Settings', exact: true })
			.click()

		// 2. Main tests
		const main = page.getByRole('main')

		const languageSection = main.locator('section').filter({
			has: page.getByRole('heading', { name: 'Language', exact: true }),
		})

		const selectTrigger = languageSection.getByRole('combobox')

		const languagesMenu = page
			.getByRole('presentation')
			.getByRole('listbox', { name: 'Language', exact: true })

		const languagesMenuOptions = languagesMenu.getByRole('option')

		/// Initial state
		{
			// TODO: The result of this will vary based on system language preferences.
			await expect(
				selectTrigger
					.getByText(/^Follow System Preference/)
					.or(selectTrigger.getByText(/^English/)),
			).toBeVisible()

			await selectTrigger.click()

			await expect(languagesMenu).toBeVisible()

			await expect(languagesMenuOptions.nth(0)).toHaveAccessibleName(
				'Follow system preference',
			)
			await expect(languagesMenuOptions.nth(0)).toHaveAttribute(
				'aria-selected',
				'true',
			)
			await expect(languagesMenuOptions.nth(0)).toHaveAttribute(
				'data-value',
				'system',
			)

			const allLanguages = (
				await import('../../../languages.json', {
					with: { type: 'json' },
				})
			).default

			const translatedLanguages = (
				await import(
					'../../../src/renderer/src/generated/translated-languages.generated.json',
					{ with: { type: 'json' } }
				)
			).default

			for (const languageCode of translatedLanguages) {
				// NOTE: We intentionally do not show the regional variant for now.
				// This will change in the future once we have
				// multiple language variants that we actually support.
				const baseTag = languageCode.split('-')[0]!

				const { nativeName } =
					allLanguages[baseTag as keyof typeof allLanguages]!

				const option = languagesMenuOptions.filter({
					hasNotText: 'Follow system preference',
					hasText: nativeName,
				})

				await expect(option).toHaveAccessibleName(nativeName)
				await expect(option).toHaveAttribute('data-value', languageCode)
				await expect(option).toHaveAttribute('aria-selected', 'false')
			}
		}

		/// Updating selected value
		{
			const portugueseOption = languagesMenuOptions.filter({
				hasText: 'Portuguese',
			})

			await portugueseOption.click()

			await expect(languagesMenu).not.toBeVisible()

			await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')

			await expect(selectTrigger).toHaveText('Português')

			await expect(
				main.locator('header').getByRole('heading', {
					name: 'Configurações do CoMapeo',
					exact: true,
				}),
			).toBeVisible()
		}

		/// Restore language selection
		{
			await selectTrigger.click()

			await expect(languagesMenu).toBeVisible()

			const portugueseOption = languagesMenuOptions.filter({
				hasText: 'Portuguese',
			})

			await expect(portugueseOption).toHaveAttribute('aria-selected', 'true')

			const systemPreferencesOption = languagesMenuOptions.nth(0)

			await expect(systemPreferencesOption).toHaveAttribute(
				'aria-selected',
				'false',
			)

			await systemPreferencesOption.click()

			await expect(languagesMenu).not.toBeVisible()

			await expect(page.locator('html')).toHaveAttribute(
				'lang',
				// TODO: The result of this will vary based on system language preferences.
				/^(en$|en-)/,
			)

			// TODO: The result of this will vary based on system language preferences.
			await expect(
				selectTrigger
					.getByText(/^Follow System Preference/)
					.or(selectTrigger.getByText(/^English/)),
			).toBeVisible()
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('coordinate system', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
		})

		await page
			.getByRole('link', { name: 'CoMapeo Settings', exact: true })
			.click()

		// 2. Main tests
		const main = page.getByRole('main')

		const coordinateSystemSection = main.locator('section').filter({
			has: page.getByRole('heading', {
				name: 'Coordinate System',
				exact: true,
			}),
		})

		const radioGroup = coordinateSystemSection.getByRole('radiogroup', {
			name: 'Coordinate System',
			exact: true,
		})

		/// Initial state
		{
			const utmOption = radioGroup.getByRole('radio', {
				name: 'UTM (Universal Transverse Mercator)',
				exact: true,
				checked: true,
			})
			await expect(utmOption).toHaveValue('utm')

			const uncheckedOptions = radioGroup.getByRole('radio', { checked: false })
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

		/// Updating selected value
		{
			const ddOption = radioGroup.getByRole('radio', {
				name: 'DD (Decimal Degrees)',
				exact: true,
			})

			await ddOption.click()

			await expect(ddOption).toHaveJSProperty('checked', true)
		}

		/// Restore selection
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

			await utmOption.click()

			await expect(utmOption).toHaveJSProperty('checked', true)
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('unit system', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
		})

		await page
			.getByRole('link', { name: 'CoMapeo Settings', exact: true })
			.click()

		// 2. Main tests
		const main = page.getByRole('main')

		const unitSystemSection = main.locator('section').filter({
			has: page.getByRole('heading', { name: 'Unit System', exact: true }),
		})

		const radioGroup = unitSystemSection.getByRole('radiogroup', {
			name: 'Unit System',
			exact: true,
		})

		/// Initial state
		{
			const metricOption = radioGroup.getByRole('radio', {
				name: 'Metric System',
				exact: true,
				checked: true,
			})

			await expect(metricOption).toHaveValue('metric')

			const uncheckedOptions = radioGroup.getByRole('radio', { checked: false })

			await expect(uncheckedOptions).toHaveCount(1)

			await expect(uncheckedOptions.first()).toHaveAccessibleName(
				'Imperial System',
			)

			await expect(uncheckedOptions.first()).toHaveValue('imperial')
		}

		/// Updating selected value
		{
			const imperialOption = radioGroup.getByRole('radio', {
				name: 'Imperial System',
				exact: true,
			})

			await imperialOption.click()

			await expect(imperialOption).toHaveJSProperty('checked', true)
		}

		/// Restore selection
		{
			await expect(
				radioGroup.getByRole('radio', {
					name: 'Imperial System',
					exact: true,
					checked: true,
				}),
			).toBeVisible()

			const metricOption = unitSystemSection.getByRole('radio', {
				name: 'Metric System',
				exact: true,
			})

			await metricOption.click()

			await expect(metricOption).toHaveJSProperty('checked', true)
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('background map', async ({ appInfo, userParams, projectParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
		})

		await simulateCreateProject({
			page,
			projectName: projectParams.projectName,
		})

		await page
			.getByRole('link', {
				name: `Go to project ${projectParams.projectName}.`,
				exact: true,
			})
			.click()

		await page
			.getByRole('navigation', { name: 'Project navigation', exact: true })
			.getByRole('link', { name: 'Background Map', exact: true })
			.click()

		// 2. Main tests
		const main = page.getByRole('main')

		/// Header
		{
			const header = main.locator('header')

			await expect(
				header.getByRole('button', { name: 'Go back.', exact: true }),
			).toBeVisible()

			await expect(
				header.getByRole('heading', { name: 'Background Map', exact: true }),
			).toBeVisible()
		}

		await expect(
			main.getByText(
				'Custom background maps are viewable offline and only on this device.',
				{ exact: true },
			),
		).toBeVisible()

		await expect(
			main.getByText('Accepted file types are .smp', { exact: true }),
		).toBeVisible()

		/// Choose file (cancelled)
		{
			const chooseFileInput = main.getByLabel('Choose File', { exact: true })

			await chooseFileInput.setInputFiles([])

			await expect(page.getByRole('dialog')).not.toBeVisible()
		}

		/// Choose file (bad file)
		{
			const chooseFileInput = main.getByLabel('Choose File', {
				exact: true,
			})

			await chooseFileInput.setInputFiles([join(ASSETS_DIR, 'bad-map.smp')])

			const dialog = page.getByRole('dialog')
			await expect(
				dialog.getByRole('heading', {
					name: 'Something Went Wrong',
					exact: true,
				}),
			).toBeVisible()
			await dialog.getByRole('button', { name: 'Close', exact: true }).click()
			await expect(dialog).not.toBeVisible()
		}

		/// Choose file (good file)
		{
			const chooseFileInput = main.getByLabel('Choose File', { exact: true })

			await chooseFileInput.setInputFiles([
				join(ASSETS_DIR, 'maplibre-demotiles.smp'),
			])

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
				main.getByRole('button', { name: 'Choose File', exact: true }),
			).not.toBeVisible()

			await expect(main.getByText('MapLibre')).toBeVisible()
			await expect(main.getByText(/^\d MB$/)).toBeVisible()

			// TODO: Ideally check for the actual values
			const dateAdded = main.getByText(/^Added on .+/)
			await expect(dateAdded).toBeVisible()
			const dateAddedTime = dateAdded.getByRole('time')
			await expect(dateAddedTime).not.toBeEmpty()
			await expect(dateAddedTime).toHaveAttribute('datetime')

			await expect(
				main.getByRole('button', { name: 'Remove Map', exact: true }),
			).toBeVisible()
		}

		/// Remove file
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
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('data and privacy section', async ({ appInfo, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
		})

		await page
			.getByRole('link', { name: 'CoMapeo Settings', exact: true })
			.click()

		// 2. Main tests
		const main = page.getByRole('main')

		const dataAndPrivacySection = main.locator('section').filter({
			has: page.getByRole('heading', {
				name: 'CoMapeo respects your privacy and autonomy',
				exact: true,
			}),
		})

		// TODO: Assert behavior of `Learn More` link
		await expect(
			dataAndPrivacySection.getByRole('link', {
				name: 'Learn More',
				exact: true,
			}),
		).toBeVisible()

		/// Diagnostic Information section
		{
			const diagnosticInformationSection = dataAndPrivacySection
				.locator('section')
				.filter({
					has: page.getByRole('heading', {
						name: 'Diagnostic Information',
						exact: true,
					}),
				})

			await expect(
				diagnosticInformationSection.getByText(
					'Anonymized information about your device, app crashes, errors and performance helps Awana Digital improve the app and fix errors.',
					{ exact: true },
				),
			).toBeVisible()

			await expect(
				diagnosticInformationSection
					.getByRole('listitem')
					.getByText(
						'This never includes any of your data or personal information.',
						{ exact: true },
					),
			).toBeVisible()

			await expect(
				diagnosticInformationSection
					.getByRole('listitem')
					.getByText(
						'You can opt-out of sharing diagnostic information at any time.',
						{ exact: true },
					),
			).toBeVisible()

			const diagnosticCheckbox = diagnosticInformationSection.getByRole(
				'checkbox',
				{ name: 'Share Diagnostic Information', exact: true },
			)

			await expect(diagnosticCheckbox).toHaveJSProperty('checked', true)
			await diagnosticCheckbox.click()
			await expect(diagnosticCheckbox).toHaveJSProperty('checked', false)
		}

		/// App Usage section
		{
			const appUsageSection = dataAndPrivacySection.locator('section').filter({
				has: page.getByRole('heading', { name: 'App Usage', exact: true }),
			})

			await expect(
				appUsageSection.getByText(
					'Share how you use CoMapeo with Awana Digital — no information you share can be used to track you.',
					{ exact: true },
				),
			).toBeVisible()

			await expect(
				appUsageSection
					.getByRole('listitem')
					.getByText(
						'ID numbers are scrambled randomly and changed every month.',
						{ exact: true },
					),
			).toBeVisible()

			await expect(
				appUsageSection
					.getByRole('listitem')
					.getByText('CoMapeo never stores IP addresses.', { exact: true }),
			).toBeVisible()

			const appUsageCheckbox = appUsageSection.getByRole('checkbox', {
				name: 'Share App Usage',
				exact: true,
			})

			await expect(appUsageCheckbox).toHaveJSProperty('checked', false)
			await appUsageCheckbox.click()
			await expect(appUsageCheckbox).toHaveJSProperty('checked', true)
			await appUsageCheckbox.click()
			await expect(appUsageCheckbox).toHaveJSProperty('checked', false)
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})
