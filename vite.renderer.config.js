import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { pluginExposeRenderer } from './vite.base.config.js'

export default defineConfig((env) => {
  /** @type {import('vite').ConfigEnv<'renderer'>} */
  const forgeEnv = env

  const { root, mode, forgeConfigSelf } = forgeEnv

  const name = forgeConfigSelf.name ?? ''

  /** @type {import('vite').UserConfig} */
  return {
    root,
    mode,
    base: './',
    build: {
      outDir: `.vite/renderer/${name}`,
    },
    plugins: [pluginExposeRenderer(name), react()],
    resolve: {
      preserveSymlinks: true,
    },
    clearScreen: false,
  }
})
