import { defineConfig, mergeConfig } from 'vite'

import {
  external,
  getBuildConfig,
  pluginHotRestart,
} from './vite.base.config.js'

export default defineConfig((env) => {
  /** @type {import('vite').ConfigEnv<'build'>} */
  const forgeEnv = env

  const { forgeConfigSelf } = forgeEnv

  /** @type {import('vite').UserConfig} */
  const config = {
    build: {
      outDir: '.vite/build/preload',
      rollupOptions: {
        external,
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: forgeConfigSelf.entry,
        output: {
          // For now, cannot be 'es' due to Electron caveat: https://www.electronjs.org/docs/latest/tutorial/esm#sandboxed-preload-scripts-cant-use-esm-imports
          format: 'cjs',
          // It should not be split chunks.
          inlineDynamicImports: true,
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
    },
    plugins: [pluginHotRestart('reload')],
  }

  return mergeConfig(getBuildConfig(forgeEnv), config)
})
