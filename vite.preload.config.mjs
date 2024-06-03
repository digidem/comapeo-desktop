import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'vite'

// https://vitejs.dev/config
export default defineConfig({
  build: {
    outDir: '.vite/build/preload',
  },
  plugins: [
    typescript({
      tsconfig: './src/preload/tsconfig.json',
      noForceEmit: true,
    }),
  ],
})
