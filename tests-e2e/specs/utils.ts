import { rmSync } from 'node:fs'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
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
import * as v from 'valibot'

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
				timeout: 10_000,
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

export const OUTPUTS_DIR_PATH = fileURLToPath(
	new URL('./results/outputs', import.meta.url),
)

export async function writeOutputsFile(testName: string, value: unknown) {
	return writeFile(
		join(OUTPUTS_DIR_PATH, `${testName}.json`),
		JSON.stringify(value),
		'utf-8',
	)
}

export async function readOutputsFile(testName: string) {
	return readFile(join(OUTPUTS_DIR_PATH, `${testName}.json`), 'utf-8')
}

export const SetupOutputsSchema = v.object({
	userDataPath: v.string(),
})
export type SetupOutputs = v.InferOutput<typeof SetupOutputsSchema>

export const OnboardingOutputsSchema = v.object({
	deviceName: v.string(),
	projectName: v.string(),
})
export type OnboardingOutputs = v.InferOutput<typeof OnboardingOutputsSchema>

export const AppOutputsSchema = v.object({
	deviceName: v.string(),
	projectName: v.string(),
	projectDescription: v.string(),
	projectColor: v.object({
		name: v.string(),
		hexCode: v.pipe(v.string(), v.hexColor()),
	}),
})
export type AppOutputs = v.InferOutput<typeof AppOutputsSchema>
