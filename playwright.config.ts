import { defineConfig } from '@playwright/test'

import type { TestOptions } from './tests-e2e/specs/utils.ts'

export default defineConfig<TestOptions>({
	testDir: 'tests-e2e',
	outputDir: 'tests-e2e/results',
	forbidOnly: !!process.env.CI,
	workers: process.env.CI
		? // Based on specs defined in https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job#standard-github-hosted-runners-for-public-repositories
			3
		: undefined,
	maxFailures: 0,
	retries: 2,
	timeout: process.env.CI ? 45_000 : 30_000,
	reporter: [
		['list'],
		['html', { open: 'never', outputFolder: 'tests-e2e/playwright-report' }],
	],
	projects: [
		{
			name: 'smokescreen',
			testMatch: 'specs/smokescreen.spec.ts',
		},
		{
			name: 'onboarding',
			testMatch: 'specs/onboarding.spec.ts',
			dependencies: ['smokescreen'],
		},
		{
			name: 'app',
			testMatch: 'specs/app/*.spec.ts',
			dependencies: ['smokescreen'],
		},
	],
})
