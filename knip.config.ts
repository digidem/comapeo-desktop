import type { KnipConfig } from 'knip'

export default {
	entry: [
		'forge.config.ts',
		'src/preload/main-window.js!',
		'src/renderer/global.d.ts!',
		'src/renderer/src/index.css!',
		'src/renderer/vite-env.d.ts!',
		'src/services/core.ts!',
	],
	project: [
		'src/**/*.{js,ts,jsx,tsx}!',
		'!src/**/*.test.{js,ts,jsx,tsx}!',
		'scripts/*.{js,ts}',
		'tests-e2e/**/*.{js,ts}',
		'*.{js,ts}',
	],
	ignoreDependencies: ['@fontsource-variable/rubik'],
	ignoreExportsUsedInFile: {
		interface: true,
		type: true,
	},
	vite: {
		config: ['src/renderer/vite.config.ts'],
	},
} satisfies KnipConfig
