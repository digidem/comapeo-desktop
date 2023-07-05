import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'

// https://vitejs.dev/config
export default defineConfig({
  build: {
    outDir: '.vite/build/preload',
  },
  plugins: [
    typescript({
      tsconfig: './src/preload/tsconfig.json',
    }),
  ],
})
