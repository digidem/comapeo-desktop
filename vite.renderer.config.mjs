import typescript from '@rollup/plugin-typescript'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    react(),
    typescript({
      tsconfig: './src/renderer/tsconfig.json',
      noForceEmit: true,
    }),
  ],
})
