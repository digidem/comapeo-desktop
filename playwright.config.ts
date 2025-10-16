import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: 'tests-e2e',
	outputDir: 'tests-e2e/results',
	forbidOnly: !!process.env.CI,
	workers: process.env.CI ? 1 : undefined,
	maxFailures: 0,
	timeout: 10_000,
	reporter: [
		['list'],
		['html', { open: 'never', outputFolder: 'tests-e2e/playwright-report' }],
	],
})
