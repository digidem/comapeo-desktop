/// <reference types="vitest" />
/// <reference types="vitest/config" />
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

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
		// When packaging the app we need to use relative URL when pointing to assets
		// because the file is statically loaded (not via server)
		base: configEnv.command === 'build' ? './' : undefined,
		build: {
			outDir: path.join(PROJECT_ROOT_DIR, 'dist/renderer'),
			emptyOutDir: true,
		},
		plugins: [
			TanStackRouterVite({ routeFileIgnorePattern: '\\.test\\.tsx?$' }),
			react(),
			svgr({
				include: '**/*.svg',
				svgrOptions: {
					icon: true,
				},
			}),
		],
		test: {
			environment: 'jsdom',
		},
	}
})
