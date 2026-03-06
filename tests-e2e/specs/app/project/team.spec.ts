import { hexToRgb } from '@mui/material/styles'
import { expect } from '@playwright/test'

import { COMAPEO_BLUE } from '../../../../src/renderer/src/colors.ts'
import {
	setup,
	simulateCreateProject,
	simulateOnboarding,
	test,
} from '../../utils.ts'

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
		})

		await simulateCreateProject({
			page,
			projectName: projectParams.projectName,
		})

		await page
			.getByRole('button', {
				name: `Go to project ${projectParams.projectName}.`,
				exact: true,
			})
			.click()

		// 2. Main tests
		const main = page.getByRole('main')

		/// Navigation
		{
			// Navigate to team page
			const teamNavLink = page
				.getByRole('navigation', { name: 'Project navigation', exact: true })
				.getByRole('link', { name: 'Team', exact: true })

			await teamNavLink.click()

			// Assert nav rail state
			await expect(teamNavLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))
		}

		/// Main
		{
			await expect(
				main.getByRole('heading', { name: 'Team', exact: true }),
			).toBeVisible()

			await expect(
				main.getByRole('link', { name: 'Invite Device', exact: true }),
			).toBeVisible()

			/// Coordinators list
			await expect(
				main.getByRole('heading', { name: 'Coordinators', exact: true }),
			).toBeVisible()

			await expect(
				main.getByText(
					'Coordinators can invite devices, edit and delete data, and manage project details.',
					{ exact: true },
				),
			).toBeVisible()

			const coordinatorList = main.getByRole('list').first()

			const ownDeviceListItem = coordinatorList.getByRole('link', {
				name: `View member ${userParams.deviceName}.`,
				exact: true,
			})

			await expect(ownDeviceListItem).toBeVisible()

			await expect(
				ownDeviceListItem.getByText('This device', { exact: true }),
			).toBeVisible()

			/// Participants list
			await expect(
				main.getByRole('heading', { name: 'Participants', exact: true }),
			).toBeVisible()

			await expect(
				main.getByText(
					'Participants can take and share observations. They cannot manage users or project details.',
					{ exact: true },
				),
			).toBeVisible()

			await expect(
				main.getByText('No Participants have been added to this project.', {
					exact: true,
				}),
			).toBeVisible()

			/// Remote archives list
			await expect(
				main.getByRole('heading', { name: 'Remote Archives', exact: true }),
			).not.toBeVisible()

			/// Past collaborators list
			await expect(
				main.getByRole('heading', { name: 'Past Collaborators', exact: true }),
			).not.toBeVisible()
		}
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})

test.describe('collaborator info', () => {
	test('yourself', async ({ appInfo, projectParams, userParams }) => {
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
				.getByRole('button', {
					name: `Go to project ${projectParams.projectName}.`,
					exact: true,
				})
				.click()

			// 2. Main tests
			const main = page.getByRole('main')

			/// Navigation
			{
				// Navigate to collaborator info page
				const teamNavLink = page
					.getByRole('navigation', { name: 'Project navigation', exact: true })
					.getByRole('link', { name: 'Team', exact: true })

				await teamNavLink.click()

				await main
					.getByRole('link', {
						name: `View member ${userParams.deviceName}.`,
						exact: true,
					})
					.click()

				// Assert nav rail state
				await expect(teamNavLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))
			}

			/// Main

			await expect(
				main.getByRole('heading', { name: 'This Device', exact: true }),
			).toBeVisible()

			await expect(
				main.getByRole('heading', { name: userParams.deviceName, exact: true }),
			).toBeVisible()

			await expect(main.getByText('Coordinator', { exact: true })).toBeVisible()

			//// Other displayed collaborator info
			// TODO: Check for displayed device ID

			// TODO: Ideally check for the actual values
			const dateAdded = main.getByText(/^Added on .+/)
			await expect(dateAdded).toBeVisible()
			const dateAddedTime = dateAdded.getByRole('time')
			await expect(dateAddedTime).not.toBeEmpty()
			await expect(dateAddedTime).toHaveAttribute('datetime')

			/// Actions
			await expect(
				main.getByRole('button', { name: 'Leave Project', exact: true }),
			).toBeVisible()
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})
})

test.describe('leave project', () => {
	test('last device', async ({ appInfo, projectParams, userParams }) => {
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
				.getByRole('navigation', { name: 'App navigation', exact: true })
				.getByRole('button', {
					name: `Go to project ${projectParams.projectName}.`,
					exact: true,
				})
				.click()

			// 2. Main tests
			const main = page.getByRole('main')

			/// Navigation
			{
				// Navigate to leave project flow
				const teamNavLink = page
					.getByRole('navigation', { name: 'Project navigation', exact: true })
					.getByRole('link', { name: 'Team', exact: true })

				await teamNavLink.click()

				await main
					.getByRole('link', {
						name: `View member ${userParams.deviceName}.`,
						exact: true,
					})
					.click()

				// Assert nav rail state
				await expect(teamNavLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))

				await main
					.getByRole('button', { name: 'Leave Project', exact: true })
					.click()
			}

			// Leave project dialog
			const dialog = page.getByRole('dialog')

			//// Last device warning step
			{
				await expect(
					dialog.getByRole('heading', {
						name: 'Device is last device.',
						exact: true,
					}),
				).toBeVisible()

				await expect(
					dialog.getByText(
						'If this device leaves, then all data on this project will be lost.',
						{ exact: true },
					),
				).toBeVisible()

				const suggestionsListItems = dialog
					.getByRole('list')
					.getByRole('listitem')

				await expect(suggestionsListItems).toHaveCount(1)

				await expect(suggestionsListItems).toHaveText(
					'Before leaving, export any important data.',
				)

				await dialog
					.getByRole('button', { name: 'Cancel', exact: true })
					.click()

				await expect(dialog).not.toBeVisible()

				await main
					.getByRole('button', { name: 'Leave Project', exact: true })
					.click()

				await dialog
					.getByRole('button', { name: 'Continue', exact: true })
					.click()
			}

			//// Confirmation step
			{
				await expect(
					dialog.getByRole('heading', {
						name: `Leave ${projectParams.projectName}?`,
						exact: true,
					}),
				).toBeVisible()

				await expect(
					dialog.getByText(
						'Device will no longer be able to view or contribute to this project.',
						{ exact: true },
					),
				).toBeVisible()

				await dialog
					.getByRole('button', { name: 'Cancel', exact: true })
					.click()

				await expect(dialog).not.toBeVisible()

				await main
					.getByRole('button', { name: 'Leave Project', exact: true })
					.click()

				await dialog
					.getByRole('button', { name: 'Continue', exact: true })
					.click()

				await dialog
					.getByRole('button', { name: 'Yes, Leave', exact: true })
					.click()
			}

			await page.waitForURL((url) => {
				return url.hash === '#/app'
			})

			// Project left dialog
			{
				await expect(
					dialog.getByRole('heading', {
						name: `You've left ${projectParams.projectName}.`,
						exact: true,
					}),
				).toBeVisible()

				await dialog.getByRole('button', { name: 'Close', exact: true }).click()

				await expect(dialog).not.toBeVisible()
			}

			// Assert left project is no longer referenced on home page
			{
				await expect(
					page
						.getByRole('navigation', { name: 'App navigation', exact: true })
						.getByRole('button', {
							name: `Go to project ${projectParams.projectName}.`,
							exact: true,
						}),
				).not.toBeVisible()

				await expect(
					main.getByRole('link', {
						name: `Go to project ${projectParams.projectName}.`,
						exact: true,
					}),
				).not.toBeVisible()
			}
		} finally {
			// 3. Cleanup
			await electronApp.close()
			cleanup()
		}
	})
})
