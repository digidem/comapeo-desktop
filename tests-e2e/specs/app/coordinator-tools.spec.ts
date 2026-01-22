import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hexToRgb } from '@mui/material/styles'
import { expect } from '@playwright/test'
import { stubDialog } from 'electron-playwright-helpers'

import {
	COMAPEO_BLUE,
	PROJECT_BLUE,
	PROJECT_GREEN,
	PROJECT_GREY,
	PROJECT_ORANGE,
	PROJECT_RED,
} from '../../../src/renderer/src/colors.ts'
import { setup, simulateOnboarding, test } from '../utils.ts'

const ASSETS_DIR = fileURLToPath(new URL('../../assets', import.meta.url))

test.describe.configure({ mode: 'parallel' })

test('index', async ({ appInfo, projectParams, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
			projectName: projectParams.projectName,
		})

		// 2. Main tests
		const main = page.getByRole('main')

		/// Navigation
		{
			// Navigate to coordinator tools page
			const toolsNavLink = page
				.getByRole('navigation')
				.getByRole('link', { name: 'Tools', exact: true })

			await toolsNavLink.click()

			// Assert nav rail state
			await expect(toolsNavLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))
		}

		/// Main
		{
			await expect(
				main.getByRole('heading', { name: 'Coordinator Tools', exact: true }),
			).toBeVisible()

			const settingsItems = main
				.getByRole('listitem')
				.filter({ has: page.getByRole('link') })

			await expect(settingsItems).toHaveCount(2)

			//// Project info settings item
			const projectInfoItem = settingsItems.first()

			await expect(
				projectInfoItem.getByRole('link', {
					name: 'Go to project info settings.',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				projectInfoItem.getByText(projectParams.projectName, {
					exact: true,
				}),
			).toBeVisible()

			await expect(
				projectInfoItem.getByText('Edit', { exact: true }),
			).toBeVisible()

			//// Categories set settings item
			const categoriesSetItem = settingsItems.last()

			await expect(
				categoriesSetItem.getByRole('link', {
					name: 'Go to categories settings.',
					exact: true,
				}),
			).toBeVisible()

			await expect(
				categoriesSetItem.getByText('Update', { exact: true }),
			).toBeVisible()

			await expect(
				categoriesSetItem.getByText('CoMapeo Default Categories', {
					exact: true,
				}),
			).toBeVisible()
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('project info', async ({ appInfo, projectParams, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
			projectName: projectParams.projectName,
		})

		// 2. Main tests
		const main = page.getByRole('main')

		/// Navigation
		{
			// Navigate to project info settings page
			const toolsNavLink = page
				.getByRole('navigation')
				.getByRole('link', { name: 'Tools', exact: true })

			await toolsNavLink.click()

			await main
				.getByRole('link', {
					name: 'Go to project info settings.',
					exact: true,
				})
				.click()

			// Assert nav rail state
			await expect(toolsNavLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))

			const disabledNavLinks = page
				.getByRole('navigation')
				.getByRole('link', { disabled: true })

			await expect(disabledNavLinks.first()).toHaveAccessibleName(
				'View project.',
			)

			await expect(disabledNavLinks.nth(1)).toHaveAccessibleName(
				'View exchange.',
			)

			await expect(disabledNavLinks).toHaveText(['', '', 'Team', 'Settings'])
		}

		/// Main
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
			await expect(projectNameInput).toHaveValue(projectParams.projectName)

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
		await main
			.getByRole('link', { name: 'Go to project info settings.', exact: true })
			.click()

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
			await main
				.getByRole('link', {
					name: 'Go to project info settings.',
					exact: true,
				})
				.click()

			// Assert inputs state
			const projectNameInput = main.getByRole('textbox', {
				name: 'Project Name',
				exact: true,
			})

			await expect(projectNameInput).toBeVisible()
			await expect(projectNameInput).toHaveValue(projectParams.projectName)

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
			await main
				.getByRole('link', {
					name: 'Go to project info settings.',
					exact: true,
				})
				.click()

			// Assert inputs state
			const projectNameInput = main.getByRole('textbox', {
				name: 'Project Name',
				exact: true,
			})

			await expect(projectNameInput).toBeVisible()
			await expect(projectNameInput).toHaveValue(projectParams.projectName)

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
		await main
			.getByRole('link', { name: 'Go to project info settings.', exact: true })
			.click()

		//// Updating and saving project info
		const updatedProjectParams = {
			projectName: 'Project e2e Updated',
			projectDescription: 'Updated project description for e2e tests',
			projectColor: { name: 'Orange', hexCode: PROJECT_ORANGE },
		}

		{
			await main
				.getByRole('textbox', {
					name: 'Project Name',
					exact: true,
				})
				.fill(updatedProjectParams.projectName)

			main
				.getByRole('textbox', {
					name: 'Project Description',
					exact: true,
				})
				.fill(updatedProjectParams.projectDescription)

			// NOTE: Using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) is sometimes flaky in CI
			await main
				.getByLabel('Project Card Color', { exact: true })
				.getByRole('checkbox', {
					name: updatedProjectParams.projectColor.name,
					exact: true,
				})
				.click()
			await expect(
				main
					.getByLabel('Project Card Color', { exact: true })
					.getByRole('checkbox', {
						name: updatedProjectParams.projectColor.name,
						exact: true,
					}),
			).toBeChecked()

			main.getByRole('button', { name: 'Save', exact: true }).click()

			// Check relevant changes are reflected in project settings index page
			{
				const projectInfoItem = main.getByRole('listitem').first()

				await expect(
					projectInfoItem.getByText(updatedProjectParams.projectName, {
						exact: true,
					}),
				).toBeVisible()

				await projectInfoItem
					.getByRole('link', {
						name: 'Go to project info settings.',
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

				await expect(projectNameInput).toHaveValue(
					updatedProjectParams.projectName,
				)

				const projectDescriptionInput = main.getByRole('textbox', {
					name: 'Project Description',
					exact: true,
				})

				await expect(projectDescriptionInput).toHaveValue(
					updatedProjectParams.projectDescription,
				)

				await expect(
					main
						.getByLabel('Project Card Color', {
							exact: true,
						})
						.getByRole('checkbox', {
							name: updatedProjectParams.projectColor.name,
							exact: true,
							checked: true,
						}),
				).toBeVisible()

				await main
					.getByRole('button', { name: 'Go back.', exact: true })
					.click()
			}
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test('categories', async ({ appInfo, projectParams, userParams }) => {
	const { launchApp, cleanup } = await setup()
	const electronApp = await launchApp({ appInfo })

	try {
		const page = await electronApp.firstWindow()

		// 1. Setup
		await simulateOnboarding({
			page,
			deviceName: userParams.deviceName,
			projectName: projectParams.projectName,
		})

		// 2. Main tests
		const main = page.getByRole('main')

		/// Navigation
		{
			// Navigate to categories settings page
			const toolsNavLink = page
				.getByRole('navigation')
				.getByRole('link', { name: 'Tools', exact: true })

			await toolsNavLink.click()

			await main
				.getByRole('link', { name: 'Go to categories settings.', exact: true })
				.click()

			// Assert nav rail state
			const enabledNavLinks = page
				.getByRole('navigation')
				.getByRole('link', { disabled: false })

			await expect(enabledNavLinks.first()).toHaveAccessibleName(
				'View project.',
			)

			await expect(enabledNavLinks.nth(1)).toHaveAccessibleName(
				'View exchange.',
			)

			await expect(enabledNavLinks).toHaveText([
				'',
				'',
				'Team',
				'Tools',
				'Settings',
			])
		}

		/// Main
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
			const dateCreated = main.getByText(/^Created .+/)
			await expect(dateCreated).toBeVisible()
			const dateCreatedTime = dateCreated.getByRole('time')
			await expect(dateCreatedTime).not.toBeEmpty()
			await expect(dateCreatedTime).toHaveAttribute('datetime')

			// TODO: Ideally check for the actual values
			const dateAdded = main.getByText(/^Added .+/)
			await expect(dateAdded).toBeVisible()
			const dateAddedTime = dateAdded.getByRole('time')
			await expect(dateAddedTime).not.toBeEmpty()
			await expect(dateAddedTime).toHaveAttribute('datetime')

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
				filePaths: [join(ASSETS_DIR, 'bad-categories-archive.comapeocat')],
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
				filePaths: [join(ASSETS_DIR, 'good-categories-archive.comapeocat')],
			})

			await main
				.getByRole('button', { name: 'Upload New Set', exact: true })
				.click()

			await expect(
				main.getByRole('heading', { name: 'Test Categories', exact: true }),
			).toBeVisible()

			await expect(main.getByText(/^Added .+/)).toBeVisible()

			// TODO: Ideally check for the actual values
			const dateCreated = main.getByText(/^Added .+/)
			await expect(dateCreated).toBeVisible()
			const dateCreatedTime = dateCreated.getByRole('time')
			await expect(dateCreatedTime).not.toBeEmpty()
			await expect(dateCreatedTime).toHaveAttribute('datetime')

			// TODO: Ideally check for the actual values
			const dateAdded = main.getByText(/^Added .+/)
			await expect(dateAdded).toBeVisible()
			const dateAddedTime = dateAdded.getByRole('time')
			await expect(dateAddedTime).not.toBeEmpty()
			await expect(dateAddedTime).toHaveAttribute('datetime')

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
						name: 'Go to categories settings.',
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
			const dateCreated = main.getByText(/^Added .+/)
			await expect(dateCreated).toBeVisible()
			const dateCreatedTime = dateCreated.getByRole('time')
			await expect(dateCreatedTime).not.toBeEmpty()
			await expect(dateCreatedTime).toHaveAttribute('datetime')

			// TODO: Ideally check for the actual values
			const dateAdded = main.getByText(/^Added .+/)
			await expect(dateAdded).toBeVisible()
			const dateAddedTime = dateAdded.getByRole('time')
			await expect(dateAddedTime).not.toBeEmpty()
			await expect(dateAddedTime).toHaveAttribute('datetime')

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
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})
