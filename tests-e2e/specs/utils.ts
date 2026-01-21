import { rmSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
	test as base,
	_electron as electron,
	type Page,
} from '@playwright/test'
import {
	findLatestBuild,
	parseElectronApp,
	type ElectronAppInfo,
} from 'electron-playwright-helpers'

export type TestOptions = {
	projectParams: { projectName: string }
	userParams: { deviceName: string }
}

export const test = base.extend<{ appInfo: ElectronAppInfo } & TestOptions>({
	appInfo: (
		// eslint-disable-next-line no-empty-pattern
		{},
		use,
	) => {
		const latestBuild = findLatestBuild()
		const appInfo = parseElectronApp(latestBuild)

		if (appInfo.packageJson.productName !== 'CoMapeo Desktop Internal') {
			throw new Error(
				'Tests can only be run against internal builds of the application',
			)
		}

		use(appInfo)
	},
	projectParams: [{ projectName: 'Project (e2e)' }, { option: true }],
	userParams: [{ deviceName: 'Desktop (e2e)' }, { option: true }],
})

export async function setup() {
	const userDataPath = await mkdtemp(join(tmpdir(), 'comapeo-test-e2e-'))

	const clearUserData = () => {
		rmSync(userDataPath, { force: true, recursive: true })
	}

	// Handles case where we manually stop the tests before they finish (e.g. SIGABORT)
	process.on('exit', clearUserData)

	return {
		userDataPath,
		launchApp: async ({ appInfo }: { appInfo: ElectronAppInfo }) => {
			return electron.launch({
				args: [appInfo.main],
				executablePath: appInfo.executable,
				env: {
					...process.env,
					USER_DATA_PATH: userDataPath,
				},
				timeout: 15_000,
			})
		},
		cleanup: () => {
			clearUserData()
			process.off('exit', clearUserData)
		},
	}
}

export async function simulateOnboarding({
	deviceName,
	projectName,
	page,
}: {
	deviceName: string
	projectName: string
	page: Page
}) {
	await page.getByRole('link', { name: 'Get Started' }).click()
	await page.getByRole('link', { name: 'Next', exact: true }).click()
	await page
		.getByRole('textbox', { name: 'Device Name', exact: true })
		.fill(deviceName)
	await page.getByRole('button', { name: 'Add Name', exact: true }).click()
	await page
		.getByRole('link', { name: 'Start New Project', exact: true })
		.click()
	await page
		.getByRole('textbox', { name: 'Project Name', exact: true })
		.fill(projectName)
	await page.getByRole('button', { name: 'Create', exact: true }).click()

	await page
		.getByRole('link', { name: 'Start Using CoMapeo', exact: true })
		.click({
			// NOTE: Depending on machine, project creation might take a bit longer.
			timeout: 10_000,
		})

	await page.waitForURL((url) => {
		return /^#\/app\/projects\/[a-zA-Z0-9]+/.test(url.hash)
	})
}
