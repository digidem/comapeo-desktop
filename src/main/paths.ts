// We define the strings as constants outside of the new URL() constructor to prevent
// Vite from trying to transform it into an asset
// https://vitejs.dev/guide/assets.html#new-url-url-import-meta-url
// Ideally we do something like `assetsInlineLimit: 0` in the Vite configuration but that is ignored if `build.lib` is specified
// https://vitejs.dev/config/build-options#build-assetsinlinelimit

const relativeDatabaseMigrationsDirectory =
  '../../node_modules/@mapeo/core/drizzle'
export const DATABASE_MIGRATIONS_DIRECTORY = new URL(
  relativeDatabaseMigrationsDirectory,
  import.meta.url,
).pathname

const relativeDefaultConfigPath =
  '../../node_modules/@mapeo/default-config/dist/mapeo-default-config.mapeoconfig'
export const DEFAULT_CONFIG_PATH = new URL(
  relativeDefaultConfigPath,
  import.meta.url,
).pathname

const relativeOfflineMapDirectory = '../../node_modules/mapeo-offline-map'
export const FALLBACK_MAP_DIRECTORY = new URL(
  relativeOfflineMapDirectory,
  import.meta.url,
).pathname

const relativeMainWindowRendererPath = `../../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
export const MAIN_WINDOW_RENDERER_PATH = new URL(
  relativeMainWindowRendererPath,
  import.meta.url,
).pathname

const relativeMainWindowPreloadPath = '../preload/main-window.js'
export const MAIN_WINDOW_PRELOAD_PATH = new URL(
  relativeMainWindowPreloadPath,
  import.meta.url,
).pathname

const relativeCoreServicePath = '../service/core.js'
export const CORE_SERVICE_PATH = new URL(
  relativeCoreServicePath,
  import.meta.url,
).pathname
