import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from '@playwright/test'
import { stubDialog } from 'electron-playwright-helpers'

import {
	PROJECT_BLUE,
	PROJECT_GREEN,
	PROJECT_GREY,
	PROJECT_ORANGE,
	PROJECT_RED,
} from '../../../../src/renderer/src/colors.ts'
import {
	setup,
	simulateCreateProject,
	simulateOnboarding,
	test,
} from '../../utils.ts'

const ASSETS_DIR = fileURLToPath(new URL('../../../assets', import.meta.url))

test.describe.configure({ mode: 'parallel' })

test('project info modal', async ({ appInfo, projectParams, userParams }) => {
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
			projectName: projectParams.projectName,
			page,
		})

		await page
			.getByRole('link', {
				name: `Go to project ${projectParams.projectName}.`,
				exact: true,
			})
			.click()

		// 2. Main tests
		const projectInfoTrigger = page
			.getByRole('navigation', { name: 'Project navigation', exact: true })
			.getByRole('button', {
				name: `Project info for ${projectParams.projectName}`,
				exact: true,
			})

		await projectInfoTrigger.click()

		const projectInfoDialog = page.getByRole('dialog')

		/// Project info section
		{
			await expect(
				projectInfoDialog.getByText(projectParams.projectName, {
					exact: true,
				}),
			).toBeVisible()

			await expect(
				projectInfoDialog.getByRole('link', {
					name: 'Edit Info',
					exact: true,
				}),
			).toBeVisible()
		}

		const listItems = projectInfoDialog.getByRole('list').getByRole('listitem')

		await expect(listItems).toHaveCount(2)

		/// Team role list item
		{
			const teamListItem = listItems.nth(0)

			await expect(
				teamListItem.getByText('Coordinator', { exact: true }),
			).toBeVisible()

			await expect(
				teamListItem.getByRole('link', { name: 'View Team', exact: true }),
			).toBeVisible()
		}

		/// Categories list item
		{
			const categoriesListItem = listItems.nth(1)

			await expect(
				categoriesListItem.getByText('CoMapeo Default Categories', {
					exact: true,
				}),
			).toBeVisible()

			// TODO: Ideally check for the actual values
			const dateCreated = categoriesListItem.getByText(/^Created .+/)
			await expect(dateCreated).toBeVisible()
			const dateCreatedTime = dateCreated.getByRole('time')
			await expect(dateCreatedTime).not.toBeEmpty()
			await expect(dateCreatedTime).toHaveAttribute('datetime')

			// TODO: Ideally check for the actual values
			const dateAdded = categoriesListItem.getByText(/^Added .+/)
			await expect(dateAdded).toBeVisible()
			const dateAddedTime = dateAdded.getByRole('time')
			await expect(dateAddedTime).not.toBeEmpty()
			await expect(dateAddedTime).toHaveAttribute('datetime')

			await expect(
				categoriesListItem.getByRole('button', { name: 'Update', exact: true }),
			).toBeVisible()
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test.describe('project info settings', () => {
	test('basic UI checks', async ({ appInfo, projectParams, userParams }) => {
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
				projectName: projectParams.projectName,
				page,
			})

			await page
				.getByRole('link', {
					name: `Go to project ${projectParams.projectName}.`,
					exact: true,
				})
				.click()

			// 2. Main tests
			const main = page.getByRole('main')

			/// Navigation
			{
				// Navigate to project info settings page
				const projectInfoTrigger = page
					.getByRole('navigation', { name: 'Project navigation', exact: true })
					.getByRole('button', {
						name: `Project info for ${projectParams.projectName}`,
						exact: true,
					})

				await projectInfoTrigger.click()

				await page
					.getByRole('dialog')
					.getByRole('link', { name: 'Edit Info', exact: true })
					.click()
			}

			/// Main

			// Page header
			{
				await expect(
					main.getByRole('heading', { name: 'Edit Info', exact: true }),
				).toBeVisible()

				await expect(
					main.getByRole('button', { name: 'Go back.', exact: true }),
				).toBeVisible()
			}

			// Interactive elements
			{
				await expect(
					main.getByRole('textbox', { name: 'Project Name', exact: true }),
				).toBeVisible()

				await expect(
					main.getByRole('textbox', { name: 'Short Description', exact: true }),
				).toBeVisible()

				const projectColorInput = main.getByLabel('Project Card Color', {
					exact: true,
				})

				await expect(projectColorInput).toBeVisible()

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

	test('form behavior', async ({ appInfo, projectParams, userParams }) => {
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
				projectName: projectParams.projectName,
				page,
			})

			await page
				.getByRole('link', {
					name: `Go to project ${projectParams.projectName}.`,
					exact: true,
				})
				.click()

			const projectInfoTrigger = page
				.getByRole('navigation', { name: 'Project navigation', exact: true })
				.getByRole('button', {
					name: `Project info for ${projectParams.projectName}`,
					exact: true,
				})

			await projectInfoTrigger.click()

			const projectInfoDialog = page.getByRole('dialog')

			projectInfoDialog
				.getByRole('link', { name: 'Edit Info', exact: true })
				.click()

			// 2. Main tests

			/// Main
			const main = page.getByRole('main')

			//// Initial state
			{
				const projectNameInput = main.getByRole('textbox', {
					name: 'Project Name',
					exact: true,
				})

				await expect(projectNameInput).toHaveValue(projectParams.projectName)

				const projectDescriptionInput = main.getByRole('textbox', {
					name: 'Short Description',
					exact: true,
				})

				await expect(projectDescriptionInput).toHaveValue('')

				await expect(
					main
						.getByLabel('Project Card Color', {
							exact: true,
						})
						.getByRole('checkbox', { checked: true }),
				).toHaveCount(1)
			}

			await main.getByRole('button', { name: 'Go back.', exact: true }).click()

			await projectInfoTrigger.click()

			await projectInfoDialog
				.getByRole('link', { name: 'Edit Info', exact: true })
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
					.getByRole('textbox', { name: 'Short Description', exact: true })
					.fill('Description in back button test')

				await main
					.getByLabel('Project Card Color', { exact: true })
					.getByRole('checkbox')
					.first()
					.click()

				// Leave and re-enter using back button
				await main
					.getByRole('button', { name: 'Go back.', exact: true })
					.click()

				const discardEditsDialog = page.getByRole('dialog')

				await expect(
					discardEditsDialog.getByRole('heading', { name: 'Discard Edits?' }),
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

				await projectInfoTrigger.click()

				await projectInfoDialog
					.getByRole('link', { name: 'Edit Info', exact: true })
					.click()

				// Assert inputs state
				await expect(
					main.getByRole('textbox', {
						name: 'Project Name',
						exact: true,
					}),
				).toHaveValue(projectParams.projectName)

				await expect(
					main.getByRole('textbox', {
						name: 'Short Description',
						exact: true,
					}),
				).toHaveValue('')

				await expect(
					main
						.getByLabel('Project Card Color', {
							exact: true,
						})
						.getByRole('checkbox', { checked: true }),
				).toHaveCount(1)
			}

			//// Input validation

			const characterCountOutputLocator = main.locator(
				'output[name="character-count"]',
			)
			const projectNameCharacterCount = characterCountOutputLocator.nth(0)
			const projectDescriptionCharacterCount =
				characterCountOutputLocator.nth(1)

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

				await expect(projectNameCharacterCount).toHaveText(
					`${invalidProjectName.length}/100`,
				)

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

				await expect(projectNameCharacterCount).toHaveText('0/100')

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
					name: 'Short Description',
					exact: true,
				})

				const invalidProjectName = Array(61).fill('a').join('')

				await projectDescriptionInput.fill(invalidProjectName)

				// Too long
				await expect(
					main.getByText('Too long, try a shorter description.', {
						exact: true,
					}),
				).toBeVisible()

				await expect(projectDescriptionCharacterCount).toHaveText(
					`${invalidProjectName.length}/60`,
				)

				// Save button does nothing
				const currentUrl = page.url()

				await main
					.getByRole('button', { name: 'Save', exact: true })
					.click({ force: true })

				expect(page.url()).toStrictEqual(currentUrl)
			}

			await main.getByRole('button', { name: 'Go back.', exact: true }).click()

			await page
				.getByRole('dialog')
				.getByRole('button', { name: 'Yes, Discard', exact: true })
				.click()

			await projectInfoTrigger.click()

			await projectInfoDialog
				.getByRole('link', { name: 'Edit Info', exact: true })
				.click()

			//// Updating and saving project info
			const updatedProjectParams = {
				projectName: 'Project e2e Updated',
				projectDescription: 'Updated project description for e2e tests',
			}

			{
				await main
					.getByRole('textbox', {
						name: 'Project Name',
						exact: true,
					})
					.fill(updatedProjectParams.projectName)

				main
					.getByRole('textbox', { name: 'Short Description', exact: true })
					.fill(updatedProjectParams.projectDescription)

				await main
					.getByLabel('Project Card Color', { exact: true })
					.getByRole('checkbox', { checked: true })
					.click()

				await main.getByRole('button', { name: 'Save', exact: true }).click()

				// Check relevant changes are reflected in project info modal
				{
					await projectInfoTrigger.click()

					await expect(
						projectInfoDialog.getByText(updatedProjectParams.projectName, {
							exact: true,
						}),
					).toBeVisible()

					await expect(
						projectInfoDialog.getByText(
							updatedProjectParams.projectDescription,
							{ exact: true },
						),
					).toBeVisible()

					await projectInfoDialog
						.getByRole('link', { name: 'Edit Info', exact: true })
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
						name: 'Short Description',
						exact: true,
					})

					await expect(projectDescriptionInput).toHaveValue(
						updatedProjectParams.projectDescription,
					)

					await expect(
						main
							.getByLabel('Project Card Color', { exact: true })
							.getByRole('checkbox', { checked: true }),
					).toHaveCount(0)
				}
			}
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})
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
		})

		await simulateCreateProject({
			projectName: projectParams.projectName,
			page,
		})

		await page
			.getByRole('link', {
				name: `Go to project ${projectParams.projectName}.`,
				exact: true,
			})
			.click()

		const projectInfoTrigger = page
			.getByRole('navigation', { name: 'Project navigation', exact: true })
			.getByRole('button', {
				name: `Project info for ${projectParams.projectName}`,
				exact: true,
			})

		await projectInfoTrigger.click()

		const projectInfoDialog = page.getByRole('dialog')

		// 2. Main tests

		const categoriesListItem = projectInfoDialog
			.getByRole('list')
			.getByRole('listitem')
			.nth(1)

		//// Initial state
		{
			await expect(
				categoriesListItem.getByText('CoMapeo Default Categories', {
					exact: true,
				}),
			).toBeVisible()

			// TODO: Ideally check for the actual values
			const dateCreated = categoriesListItem.getByText(/^Created .+/)
			await expect(dateCreated).toBeVisible()
			const dateCreatedTime = dateCreated.getByRole('time')
			await expect(dateCreatedTime).not.toBeEmpty()
			await expect(dateCreatedTime).toHaveAttribute('datetime')

			// TODO: Ideally check for the actual values
			const dateAdded = categoriesListItem.getByText(/^Added .+/)
			await expect(dateAdded).toBeVisible()
			const dateAddedTime = dateAdded.getByRole('time')
			await expect(dateAddedTime).not.toBeEmpty()
			await expect(dateAddedTime).toHaveAttribute('datetime')

			await expect(
				categoriesListItem.getByRole('button', { name: 'Update', exact: true }),
			).toBeVisible()
		}

		//// Choose file (cancelled)
		{
			await stubDialog(electronApp, 'showOpenDialog', {
				canceled: true,
				filePaths: [],
			})

			await categoriesListItem
				.getByRole('button', { name: 'Update', exact: true })
				.click()

			const errorDialog = page.getByRole('dialog').filter({
				has: page.getByRole('heading', {
					name: 'Something Went Wrong',
					exact: true,
				}),
			})

			await expect(errorDialog).not.toBeVisible()
		}

		//// Choose file (bad file)
		{
			await stubDialog(electronApp, 'showOpenDialog', {
				canceled: false,
				filePaths: [join(ASSETS_DIR, 'bad-categories-archive.comapeocat')],
			})

			await categoriesListItem
				.getByRole('button', { name: 'Update', exact: true })
				.click()

			const errorDialog = page.getByRole('dialog').filter({
				has: page.getByRole('heading', {
					name: 'Something Went Wrong',
					exact: true,
				}),
			})

			await expect(errorDialog).toBeVisible()

			await expect(
				errorDialog.getByRole('button', { name: 'Advanced', exact: true }),
			).toBeVisible()

			await errorDialog
				.getByRole('button', { name: 'Close', exact: true })
				.click()

			await expect(errorDialog).not.toBeVisible()
		}

		//// Choose file (good file)
		// TODO: Confirm that categories are being used in app
		{
			await stubDialog(electronApp, 'showOpenDialog', {
				canceled: false,
				filePaths: [join(ASSETS_DIR, 'good-categories-archive.comapeocat')],
			})

			await categoriesListItem
				.getByRole('button', { name: 'Update', exact: true })
				.click()

			await expect(
				categoriesListItem.getByText('Test Categories', { exact: true }),
			).toBeVisible()

			// TODO: Ideally check for the actual values
			const dateCreated = categoriesListItem.getByText(/^Added .+/)
			await expect(dateCreated).toBeVisible()
			const dateCreatedTime = dateCreated.getByRole('time')
			await expect(dateCreatedTime).not.toBeEmpty()
			await expect(dateCreatedTime).toHaveAttribute('datetime')

			// TODO: Ideally check for the actual values
			const dateAdded = categoriesListItem.getByText(/^Added .+/)
			await expect(dateAdded).toBeVisible()
			const dateAddedTime = dateAdded.getByRole('time')
			await expect(dateAddedTime).not.toBeEmpty()
			await expect(dateAddedTime).toHaveAttribute('datetime')
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

			await categoriesListItem
				.getByRole('button', { name: 'Update', exact: true })
				.click()

			await expect(
				categoriesListItem.getByText('CoMapeo Default Categories', {
					exact: true,
				}),
			).toBeVisible()

			// TODO: Ideally check for the actual values
			const dateCreated = categoriesListItem.getByText(/^Added .+/)
			await expect(dateCreated).toBeVisible()
			const dateCreatedTime = dateCreated.getByRole('time')
			await expect(dateCreatedTime).not.toBeEmpty()
			await expect(dateCreatedTime).toHaveAttribute('datetime')

			// TODO: Ideally check for the actual values
			const dateAdded = categoriesListItem.getByText(/^Added .+/)
			await expect(dateAdded).toBeVisible()
			const dateAddedTime = dateAdded.getByRole('time')
			await expect(dateAddedTime).not.toBeEmpty()
			await expect(dateAddedTime).toHaveAttribute('datetime')
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})
