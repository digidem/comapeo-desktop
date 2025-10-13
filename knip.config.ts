import type { KnipConfig } from 'knip'

export default {
	entry: [
		'forge.config.ts',
		'src/preload/*.js',
		'src/renderer/global.d.ts',
		'src/renderer/src/index.tsx',
		'src/renderer/src/index.css',
		'src/renderer/vite-env.d.ts',
		'src/services/core.ts',
		'src/shared/**/*.{js,ts}',
	],
	project: ['src/**/*.{js,ts,jsx,tsx}!', 'scripts/*.{js,ts}', '*.{js,ts}'],
	ignore: ['**/*.generated.{js,ts}', 'src/renderer/src/generated/**'],
	ignoreDependencies: ['@fontsource-variable/rubik', '@comapeo/fallback-smp'],
	ignoreExportsUsedInFile: {
		interface: true,
		type: true,
	},
	vite: {
		config: ['src/renderer/vite.config.ts'],
	},
} satisfies KnipConfig
