import { fileURLToPath } from 'node:url'
import { test as base } from '@playwright/test'
import {
	findLatestBuild,
	parseElectronApp,
	type ElectronAppInfo,
} from 'electron-playwright-helpers'

export const USER_DATA_PATH_FILE = fileURLToPath(
	new URL('./results/user-data-path.txt', import.meta.url),
)

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
