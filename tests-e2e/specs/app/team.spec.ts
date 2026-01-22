import { hexToRgb } from '@mui/material/styles'
import { expect } from '@playwright/test'

import { COMAPEO_BLUE } from '../../../src/renderer/src/colors.ts'
import { setup, simulateOnboarding, test } from '../utils.ts'

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
			// Navigate to team page
			const teamNavLink = page
				.getByRole('navigation')
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

test('collaborator info (yourself)', async ({
	appInfo,
	projectParams,
	userParams,
}) => {
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
			// Navigate to collaborator info page
			const teamNavLink = page
				.getByRole('navigation')
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

		//// Page title
		await expect(
			main.getByRole('heading', { name: 'Collaborator Info', exact: true }),
		).toBeVisible()

		//// Info specific to yourself
		await expect(
			main.getByRole('heading', { name: userParams.deviceName, exact: true }),
		).toBeVisible()
		await expect(main.getByText('This Device!', { exact: true })).toBeVisible()

		//// Displayed role
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

test('leave project', async ({ appInfo }) => {
	const userParams = { deviceName: 'Desktop (e2e)' }
	const projectParams = { projectName: 'Project (e2e)' }

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
			// Navigate to leave project flow
			const teamNavLink = page
				.getByRole('navigation')
				.getByRole('link', { name: 'Team', exact: true })

			await teamNavLink.click()

			await main
				.getByRole('link', {
					name: `View member ${userParams.deviceName}.`,
					exact: true,
				})
				.click()

			await main
				.getByRole('button', { name: 'Leave Project', exact: true })
				.click()

			// Assert nav rail state
			await expect(teamNavLink).toHaveCSS('color', hexToRgb(COMAPEO_BLUE))
		}

		/// Main
		await expect(
			main.getByRole('heading', { name: 'Leave Project?', exact: true }),
		).toBeVisible()

		await expect(
			main.getByText(
				`${userParams.deviceName} will no longer be able to add or exchange observations.`,
				{ exact: true },
			),
		).toBeVisible()

		await main.getByRole('button', { name: 'Confirm', exact: true }).click()

		await page.waitForURL((url) => {
			return url.hash === '#/onboarding/project'
		})
	} finally {
		// 3. Cleanup
		await electronApp.close()
		cleanup()
	}
})
