import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    outDir: '.vite/build/service',
  },
  plugins: [
    typescript({
      tsconfig: './src/service/tsconfig.json',
    }),
  ],
})
