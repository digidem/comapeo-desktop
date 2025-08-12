/// <reference types="vitest" />
/// <reference types="vitest/config" />
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { iconsSpritesheet } from 'vite-plugin-icons-spritesheet'

const PROJECT_ROOT_DIR = fileURLToPath(new URL('../../', import.meta.url))

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
					'@formatjs/icu-messageformat-parser/no-parser',
			},
		},
		// When packaging the 	 we need to use relative URL when pointing to assets
		// because the file is statically loaded (not via server)
		base: configEnv.command === 'build' ? './' : undefined,
		build: {
			outDir: path.join(PROJECT_ROOT_DIR, 'dist/renderer'),
			emptyOutDir: true,
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
				generatedRouteTree: fileURLToPath(
					new URL('./src/routeTree.gen.ts', import.meta.url),
				),
			}),
			react(),
			// TODO: `cwd` option is broken. should submit a fix at some point
			iconsSpritesheet({
				inputDir: fileURLToPath(new URL('./icons', import.meta.url)),
				outputDir: fileURLToPath(new URL('./src/images', import.meta.url)),
				fileName: 'icons-sprite.svg',
				withTypes: true,
				typesOutputFile: fileURLToPath(
					new URL('src/types/icons.generated.ts', import.meta.url),
				),
				iconNameTransformer: (name) => {
					// Return name of file as-is
					return name
				},
				formatter: 'prettier',
			}),
		],
		test: {
			environment: 'jsdom',
		},
	}
})
