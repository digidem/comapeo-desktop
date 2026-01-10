/// <reference types="vitest" />
/// <reference types="vitest/config" />
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { iconsSpritesheet } from 'vite-plugin-icons-spritesheet'

const PROJECT_ROOT_DIR = fileURLToPath(new URL('../../', import.meta.url))

const GENERATED_DIR = fileURLToPath(new URL('./src/generated', import.meta.url))

export default defineConfig((configEnv) => {
	return {
		root: path.dirname(fileURLToPath(import.meta.url)),
		envDir: PROJECT_ROOT_DIR,
		server: {
			strictPort: true,
			open: false,
		},
		resolve: {
			alias: {
				// https://formatjs.github.io/docs/guides/advanced-usage
				'@formatjs/icu-messageformat-parser':
					'@formatjs/icu-messageformat-parser/no-parser.js',
			},
		},
		// When packaging the app we need to use relative URL when pointing to assets
		// because the file is statically loaded (not via server)
		base: configEnv.command === 'build' ? './' : undefined,
		build: {
			outDir: path.join(PROJECT_ROOT_DIR, 'dist/renderer'),
			emptyOutDir: true,
			sourcemap: true,
		},
		define: {
			__APP_TYPE__: JSON.stringify(configEnv.mode),
		},
		plugins: [
			tanstackRouter({
				autoCodeSplitting: true,
				routeFileIgnorePattern: '\\.test\\.tsx?$',
				routesDirectory: fileURLToPath(
					new URL('./src/routes', import.meta.url),
				),
				target: 'react',
				generatedRouteTree: path.join(GENERATED_DIR, 'routeTree.gen.ts'),
			}),
			react(),
			// TODO: `cwd` option is broken. should submit a fix at some point
			iconsSpritesheet({
				inputDir: fileURLToPath(new URL('./icons', import.meta.url)),
				outputDir: fileURLToPath(new URL('./src/images', import.meta.url)),
				fileName: 'icons-sprite.svg',
				withTypes: true,
				typesOutputFile: path.join(GENERATED_DIR, 'icons.generated.ts'),
				iconNameTransformer: (name) => {
					// Return name of file as-is
					return name
				},
				formatter: 'prettier',
			}),
			sentryVitePlugin({
				org: process.env.SENTRY_ORG,
				project: process.env.SENTRY_PROJECT,
				authToken: process.env.SENTRY_AUTH_TOKEN,
				telemetry: false,
			}),
		],
		test: {},
	}
})
