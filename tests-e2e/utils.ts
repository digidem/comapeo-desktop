import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as base } from '@playwright/test'
import {
	findLatestBuild,
	parseElectronApp,
	type ElectronAppInfo,
} from 'electron-playwright-helpers'
import * as v from 'valibot'

export const test = base.extend<{ appInfo: ElectronAppInfo }>({
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
})

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
