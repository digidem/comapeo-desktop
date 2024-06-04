import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'vite'

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    outDir: '.vite/build/service',
    lib: { formats: ['es'] },
    rollupOptions: { output: { format: 'es' } },
  },
  plugins: [
    typescript({
      tsconfig: './src/service/tsconfig.json',
      noForceEmit: true,
    }),
  ],
})
