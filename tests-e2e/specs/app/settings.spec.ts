import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hexToRgb } from '@mui/material/styles'
import { expect } from '@playwright/test'

import { DARK_COMAPEO_BLUE } from '../../../src/renderer/src/colors.ts'
import { setup, simulateOnboarding, test } from '../utils.ts'

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
			const settingsNavLink = page
				.getByRole('navigation', { name: 'App navigation', exact: true })
				.getByRole('link', { name: 'Settings', exact: true })

			await settingsNavLink.click()
		}

		/// Main
		const main = page.getByRole('main')

		await expect(
			main.getByRole('heading', { name: 'CoMapeo Settings', exact: true }),
		).toBeVisible()

		//// General section
		await expect(
			main.getByRole('heading', { name: 'General', exact: true }),
		).toBeVisible()

		const settingsItems = main
			.getByRole('listitem')
			.filter({ has: page.getByRole('link') })

		await expect(settingsItems).toHaveCount(4)

		//// Device name settings item
		{
			const deviceNameSettingsItem = settingsItems.first()

			await expect(
				deviceNameSettingsItem.getByRole('link', {
					name: 'Go to device name settings.',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				deviceNameSettingsItem.getByText(userParams.deviceName, {
					exact: true,
				}),
			).toBeVisible()

			await expect(
				deviceNameSettingsItem.getByText('Edit', { exact: true }),
			).toBeVisible()
		}

		//// Language settings item
		{
			const languageSettingsItem = settingsItems.nth(1)

			await expect(
				languageSettingsItem.getByRole('link', {
					name: 'Go to language settings.',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				languageSettingsItem.getByText(
					// TODO: The result of this will vary based on system language preferences.
					/^English.*/,
				),
			).toBeVisible()
		}

		//// Coordinate system settings item
		{
			const coordinateSystemSettingsItem = settingsItems.nth(2)

			await expect(
				coordinateSystemSettingsItem.getByRole('link', {
					name: 'Go to coordinate system settings.',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				coordinateSystemSettingsItem.getByText('UTM Coordinates', {
					exact: true,
				}),
			).toBeVisible()
		}

		//// Background map settings item
		{
			const backgroundMapSettingsItem = settingsItems.nth(3)

			await expect(
				backgroundMapSettingsItem.getByRole('link', {
					name: 'Go to background map settings.',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				backgroundMapSettingsItem.getByText('Default Background', {
					exact: true,
				}),
			).toBeVisible()
		}

		/// Data and Privacy section
		{
			await expect(
				main.getByRole('heading', {
					name: 'Data & Privacy',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				main.getByText('CoMapeo respects your privacy and autonomy', {
					exact: true,
				}),
			).toBeVisible()

			// TODO: Assert behavior of `Learn More` button
			await expect(
				main.getByRole('link', { name: 'Learn More', exact: true }),
			).toBeVisible()

			//// Diagnostic Information section
			await expect(
				main.getByRole('heading', {
					name: 'Diagnostic Information',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				main.getByText(
					'Anonymized information about your device, app crashes, errors and performance helps Awana Digital improve the app and fix errors.',
					{ exact: true },
				),
			).toBeVisible()

			await expect(
				main
					.getByRole('listitem')
					.getByText(
						'This never includes any of your data or personal information.',
						{ exact: true },
					),
			).toBeVisible()

			await expect(
				main
					.getByRole('listitem')
					.getByText(
						'You can opt-out of sharing diagnostic information at any time.',
						{ exact: true },
					),
			).toBeVisible()

			const diagnosticCheckbox = main.getByRole('checkbox', {
				name: 'Share Diagnostic Information',
				exact: true,
			})

			// NOTE: Using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) is sometimes flaky in CI
			await expect(diagnosticCheckbox).toBeChecked()
			await diagnosticCheckbox.click()
			await expect(diagnosticCheckbox).not.toBeChecked()
		}

		/// App Usage section
		{
			await expect(
				main.getByRole('heading', { name: 'App Usage', exact: true }),
			).toBeVisible()

			await expect(
				main.getByText(
					'Share how you use CoMapeo with Awana Digital — no information you share can be used to track you.',
					{ exact: true },
				),
			).toBeVisible()

			await expect(
				main
					.getByRole('listitem')
					.getByText(
						'ID numbers are scrambled randomly and changed every month. ID numbers are scrambled randomly and changed every month.',
						{ exact: true },
					),
			).toBeVisible()

			await expect(
				main
					.getByRole('listitem')
					.getByText('CoMapeo never stores IP addresses.', { exact: true }),
			).toBeVisible()

			const appUsageCheckbox = main.getByRole('checkbox', {
				name: 'Share App Usage',
				exact: true,
			})

			// NOTE: Using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) is sometimes flaky in CI
			await expect(appUsageCheckbox).not.toBeChecked()
			await appUsageCheckbox.click()
			await expect(appUsageCheckbox).toBeChecked()
			await appUsageCheckbox.click()
			await expect(appUsageCheckbox).not.toBeChecked()
		}

		/// About CoMapeo section
		{
			await expect(
				main.getByRole('heading', { name: 'About CoMapeo', exact: true }),
			).toBeVisible()

			await expect(
				main.getByRole('heading', { name: 'CoMapeo Version', exact: true }),
			).toBeVisible()
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test.describe('device name', () => {
	test('base UI checks', async ({ appInfo, userParams }) => {
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
			const main = page.getByRole('main')

			/// Navigation
			{
				// Navigate to device name settings page
				const settingsNavLink = page
					.getByRole('navigation', { name: 'App navigation', exact: true })
					.getByRole('link', { name: 'Settings', exact: true })

				await settingsNavLink.click()

				const deviceNameSettingsLink = main.getByRole('link', {
					name: 'Go to device name settings.',
					exact: true,
				})

				await expect(
					deviceNameSettingsLink.getByText(userParams.deviceName),
				).toBeVisible()

				await deviceNameSettingsLink.click()

				// Assert app nav bar state
				await expect(settingsNavLink).toHaveCSS(
					'background-color',
					hexToRgb(DARK_COMAPEO_BLUE),
				)
			}

			/// Main

			// Subpage navigation
			{
				await expect(
					main.getByRole('button', { name: 'Go back.', exact: true }),
				).toBeVisible()

				const breadcrumbNav = main.getByRole('navigation', {
					name: 'breadcrumb',
					exact: true,
				})

				const breadcrumbItems = breadcrumbNav
					.getByRole('listitem')
					.getByRole('link')

				await expect(breadcrumbItems).toHaveCount(2)

				await expect(breadcrumbItems.nth(0)).toHaveText('CoMapeo Settings')

				await expect(breadcrumbItems.nth(1)).toHaveText('Device Name')
				await expect(breadcrumbItems.nth(1)).toHaveAttribute(
					'aria-current',
					'page',
				)
			}

			// Interactive elements
			{
				await expect(
					main.getByRole('textbox', { name: 'Device Name', exact: true }),
				).toBeVisible()

				await expect(
					main.getByRole('button', { name: 'Cancel', exact: true }),
				).toBeVisible()

				await expect(
					main.getByRole('button', { name: 'Save', exact: true }),
				).toBeVisible()
			}
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})

	test('form behavior', async ({ appInfo, userParams }) => {
		const { launchApp, cleanup } = await setup()
		const electronApp = await launchApp({ appInfo })

		try {
			const page = await electronApp.firstWindow()

			// 1. Setup
			await simulateOnboarding({
				page,
				deviceName: userParams.deviceName,
			})

			const main = page.getByRole('main')

			await page
				.getByRole('navigation', { name: 'App navigation', exact: true })
				.getByRole('link', { name: 'Settings', exact: true })
				.click()

			await main
				.getByRole('link', {
					name: 'Go to device name settings.',
					exact: true,
				})
				.click()

			// 2. Main tests
			const deviceNameInput = main.getByRole('textbox', {
				name: 'Device Name',
				exact: true,
			})

			//// Input (initial state)
			{
				await expect(deviceNameInput).toHaveValue(userParams.deviceName)

				await expect(main.locator('output[name="character-count"]')).toHaveText(
					`${userParams.deviceName.length}/60`,
				)
			}

			//// Input (invalid state, too long)
			{
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
			}

			//// Restoration of input initial state when navigating away without saving
			{
				//  Clicking external navigation control
				await main
					.getByRole('navigation', { name: 'breadcrumb', exact: true })
					.getByRole('link', { name: 'CoMapeo Settings', exact: true })
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
					.getByRole('link', {
						name: 'Go to device name settings.',
						exact: true,
					})
					.click()

				await expect(deviceNameInput).toHaveValue(userParams.deviceName)

				// Clicking cancel button on page
				await main.getByRole('button', { name: 'Cancel', exact: true }).click()

				await page
					.getByRole('link', {
						name: 'Go to device name settings.',
						exact: true,
					})
					.click()

				await expect(deviceNameInput).toHaveValue(userParams.deviceName)
			}

			//// Saving updated device name
			{
				const updatedUserParams = {
					deviceName: 'Desktop e2e Updated',
				}

				await deviceNameInput.fill(updatedUserParams.deviceName)

				await main.getByRole('button', { name: 'Save', exact: true }).click()

				await expect(
					main
						.getByRole('link', {
							name: 'Go to device name settings.',
							exact: true,
						})
						.getByText(updatedUserParams.deviceName),
				).toBeVisible()
			}
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})
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

		// 2. Main tests
		const main = page.getByRole('main')

		/// Navigation
		{
			// Navigate to language settings page
			const settingsNavLink = page
				.getByRole('navigation', { name: 'App navigation', exact: true })
				.getByRole('link', { name: 'Settings', exact: true })

			await settingsNavLink.click()

			const languageSettingsLink = main.getByRole('link', {
				name: 'Go to language settings.',
				exact: true,
			})

			await expect(
				languageSettingsLink.getByText(
					// TODO: The result of this will vary based on system language preferences.
					/^English.*/,
				),
			).toBeVisible()

			await languageSettingsLink.click()

			// Assert app nav bar state
			await expect(settingsNavLink).toHaveCSS(
				'background-color',
				hexToRgb(DARK_COMAPEO_BLUE),
			)
		}

		/// Main

		// Subpage navigation
		{
			await expect(
				main.getByRole('button', { name: 'Go back.', exact: true }),
			).toBeVisible()

			const breadcrumbNav = main.getByRole('navigation', {
				name: 'breadcrumb',
				exact: true,
			})

			const breadcrumbItems = breadcrumbNav
				.getByRole('listitem')
				.getByRole('link')

			await expect(breadcrumbItems).toHaveCount(2)

			await expect(breadcrumbItems.nth(0)).toHaveText('CoMapeo Settings')

			await expect(breadcrumbItems.nth(1)).toHaveText('Language')
			await expect(breadcrumbItems.nth(1)).toHaveAttribute(
				'aria-current',
				'page',
			)
		}

		//// Initial state
		{
			const systemPreferencesOption = main.getByRole('radio', {
				name: 'Follow system preferences',
				exact: true,
				checked: true,
			})

			await expect(systemPreferencesOption).toHaveValue('system')

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

				const { nativeName, englishName } =
					allLanguages[baseTag as keyof typeof allLanguages]!

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
			await expect(portugueseOption).toBeChecked({ timeout: 2_000 })

			await expect(
				main
					.getByRole('navigation', {
						// TODO: Will need to update when translation is added
						name: 'breadcrumb',
						exact: true,
					})
					.getByRole('link', { name: 'Idioma', exact: true }),
			).toBeVisible()

			await expect(
				main.getByRole('radio', {
					name: 'Seguir preferências do sistema',
					exact: true,
				}),
			).toBeVisible()

			await main
				.getByRole('navigation', { name: 'breadcrumb', exact: true })
				.getByRole('link', { name: 'Configurações do CoMapeo', exact: true })
				.click()

			const languageSettingsLink = main.getByRole('link', {
				name: 'Vá para as configurações de idioma.',
				exact: true,
			})

			await expect(
				languageSettingsLink.getByText('Português', { exact: true }),
			).toBeVisible()

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
			await expect(systemPreferencesOption).toBeChecked({ timeout: 2_000 })

			await main
				.getByRole('navigation', { name: 'breadcrumb', exact: true })
				.getByRole('link', { name: 'CoMapeo Settings', exact: true })
				.click()
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

		// 2. Main tests
		const main = page.getByRole('main')

		/// Navigation
		{
			// Navigate to coordinate system settings page
			const settingsNavLink = page
				.getByRole('navigation', { name: 'App navigation', exact: true })
				.getByRole('link', { name: 'Settings', exact: true })

			await settingsNavLink.click()

			const coordinateSystemSettingsLink = main.getByRole('link', {
				name: 'Go to coordinate system settings.',
				exact: true,
			})

			await expect(
				coordinateSystemSettingsLink.getByText('UTM Coordinates', {
					exact: true,
				}),
			).toBeVisible()

			await coordinateSystemSettingsLink.click()

			// Assert app nav bar state
			await expect(settingsNavLink).toHaveCSS(
				'background-color',
				hexToRgb(DARK_COMAPEO_BLUE),
			)
		}

		/// Main

		// Subpage navigation
		{
			await expect(
				main.getByRole('button', { name: 'Go back.', exact: true }),
			).toBeVisible()

			const breadcrumbNav = main.getByRole('navigation', {
				name: 'breadcrumb',
				exact: true,
			})

			const breadcrumbItems = breadcrumbNav
				.getByRole('listitem')
				.getByRole('link')

			await expect(breadcrumbItems).toHaveCount(2)

			await expect(breadcrumbItems.nth(0)).toHaveText('CoMapeo Settings')

			await expect(breadcrumbItems.nth(1)).toHaveText('Coordinate System')
			await expect(breadcrumbItems.nth(1)).toHaveAttribute(
				'aria-current',
				'page',
			)
		}

		//// Initial state
		{
			const radioGroup = main.getByRole('radiogroup')
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

			await main
				.getByRole('navigation', { name: 'breadcrumb', exact: true })
				.getByRole('link', { name: 'CoMapeo Settings', exact: true })
				.click()

			const coordinateSystemSettingsLink = main.getByRole('link', {
				name: 'Go to coordinate system settings.',
				exact: true,
			})
			await expect(
				coordinateSystemSettingsLink.getByText('DD Coordinates', {
					exact: true,
				}),
			).toBeVisible()
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

			await main
				.getByRole('navigation', { name: 'breadcrumb', exact: true })
				.getByRole('link', { name: 'CoMapeo Settings', exact: true })
				.click()
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('background map', async ({ appInfo, userParams }) => {
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
		const main = page.getByRole('main')

		/// Navigation
		{
			// Navigate to background map settings page
			const settingsNavLink = page
				.getByRole('navigation', { name: 'App navigation', exact: true })
				.getByRole('link', { name: 'Settings', exact: true })

			await settingsNavLink.click()

			const backgroundMapSettingsLink = main.getByRole('link', {
				name: 'Go to background map settings.',
				exact: true,
			})

			await expect(
				backgroundMapSettingsLink.getByText('Default Background', {
					exact: true,
				}),
			).toBeVisible()

			await backgroundMapSettingsLink.click()

			// Assert app nav bar state
			await expect(settingsNavLink).toHaveCSS(
				'background-color',
				hexToRgb(DARK_COMAPEO_BLUE),
			)
		}

		/// Main

		// Subpage navigation
		{
			await expect(
				main.getByRole('button', { name: 'Go back.', exact: true }),
			).toBeVisible()

			const breadcrumbNav = main.getByRole('navigation', {
				name: 'breadcrumb',
				exact: true,
			})

			const breadcrumbItems = breadcrumbNav
				.getByRole('listitem')
				.getByRole('link')

			await expect(breadcrumbItems).toHaveCount(2)

			await expect(breadcrumbItems.nth(0)).toHaveText('CoMapeo Settings')

			await expect(breadcrumbItems.nth(1)).toHaveText('Background Map')
			await expect(breadcrumbItems.nth(1)).toHaveAttribute(
				'aria-current',
				'page',
			)
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

		//// Choose file (cancelled)
		{
			const chooseFileInput = main.getByLabel('Choose File', { exact: true })

			await chooseFileInput.setInputFiles([])

			await expect(page.getByRole('dialog')).not.toBeVisible()
		}

		//// Choose file (bad file)
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

		//// Choose file (good file)
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

			await main
				.getByRole('navigation', { name: 'breadcrumb', exact: true })
				.getByRole('link', { name: 'CoMapeo Settings', exact: true })
				.click()

			const backgroundMapSettingsLink = main.getByRole('link', {
				name: 'Go to background map settings.',
				exact: true,
			})
			await expect(
				backgroundMapSettingsLink.getByText('MapLibre', { exact: true }),
			).toBeVisible()
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

			await main
				.getByRole('navigation', { name: 'breadcrumb', exact: true })
				.getByRole('link', { name: 'CoMapeo Settings', exact: true })
				.click()

			await expect(
				main
					.getByRole('link', {
						name: 'Go to background map settings.',
						exact: true,
					})
					.getByText('Default Background'),
			).toBeVisible()
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})
