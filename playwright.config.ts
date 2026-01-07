import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: 'tests-e2e',
	outputDir: 'tests-e2e/results',
	forbidOnly: !!process.env.CI,
	// TODO: Consider bumping to 2 in CI
	workers: process.env.CI ? 1 : undefined,
	maxFailures: 0,
	retries: 2,
	timeout: 30_000,
	reporter: [
		['list'],
		['html', { open: 'never', outputFolder: 'tests-e2e/playwright-report' }],
	],
	projects: [
		{
			name: 'onboarding',
			testMatch: /onboarding\.spec\.ts/,
		},
		// {
		// 	name: 'app',
		// 	testMatch: /app\.spec\.ts/,
		// },
	],
})
