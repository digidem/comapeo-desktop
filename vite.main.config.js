import { defineConfig, mergeConfig } from 'vite'

import {
  external,
  getBuildConfig,
  getBuildDefine,
  pluginHotRestart,
} from './vite.base.config.js'

export default defineConfig((env) => {
  /** @type {import('vite').ConfigEnv<'build'>} */
  const forgeEnv = env

  const { forgeConfigSelf } = forgeEnv

  const define = getBuildDefine(forgeEnv)

  /** @type {import('vite').UserConfig} */
  const config = {
    build: {
      outDir: '.vite/build/main',
      lib: {
        entry: forgeConfigSelf.entry,
        fileName: () => '[name].js',
        formats: ['es'],
      },
      rollupOptions: {
        external,
        output: { format: 'es' },
      },
      target: 'node20',
    },
    plugins: [pluginHotRestart('restart')],
    define: {
      ...define,
      // TODO: There might be a better way to do this
      ['VITE_PROJECT_ROOT']: JSON.stringify(import.meta.dirname),
    },
    resolve: {
      // Load the Node.js entry.
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
  }

  return mergeConfig(getBuildConfig(forgeEnv), config)
})
