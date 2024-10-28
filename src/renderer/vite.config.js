import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const PROJECT_ROOT_DIR = fileURLToPath(new URL('../../', import.meta.url))

export default defineConfig((configEnv) => {
	return {
		root: path.dirname(fileURLToPath(import.meta.url)),
		envDir: PROJECT_ROOT_DIR,
		server: {
			strictPort: true,
			open: false,
		},
		// When packaging the app we need to use relative URL when pointing to assets
		// because the file is statically loaded (not via server)
		base: configEnv.command === 'build' ? './' : undefined,
		build: {
			outDir: path.resolve(PROJECT_ROOT_DIR, 'dist/renderer'),
			emptyOutDir: true,
		},
		plugins: [react()],
	}
})
