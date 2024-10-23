import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig((configEnv) => {
	return {
		root: import.meta.url,
		server: {
			strictPort: true,
			open: false,
		},
		// When packaging the app we need to use relative URL when pointing to assets
		// because the file is statically loaded (not via server)
		base: configEnv.command === 'build' ? './' : undefined,
		build: {
			outDir: fileURLToPath(new URL('../../dist/renderer', import.meta.url)),
			emptyOutDir: true,
		},
		plugins: [react()],
	}
})
