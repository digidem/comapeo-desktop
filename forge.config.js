import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'
import { PluginBase } from '@electron-forge/plugin-base'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { FuseV1Options, FuseVersion } from '@electron/fuses'
import { build } from 'vite'

/**
 * @import {ForgeConfig, ForgeHookFn} from '@electron-forge/shared-types'
 */

/**
 * @extends {PluginBase<{}>}
 */
class CoMapeoDesktopForgePlugin extends PluginBase {
	name = 'comapeo-desktop'

	/**
	 * @param {{}} config
	 */
	constructor(config) {
		super(config)
	}

	/**
	 * @type {PluginBase<{}>['getHooks']}
	 * @override
	 */
	getHooks() {
		return {
			readPackageJson: [this.#addAppEnvToPackageJson],
			resolveForgeConfig: [this.#updatePackagerConfig],
			postStart: [this.#hookViteDevServer],
			prePackage: [this.#buildRender],
			packageAfterCopy: [this.#moveBuiltRender],
		}
	}

	/**
	 * @type {PluginBase<{}>['startLogic']}
	 * @override
	 */
	async startLogic(_opts) {
		// TODO: Start vite dev server here. Hook into forge start process in postStart hook
		return false
	}

	/**
	 * @type {ForgeHookFn<'postStart'>}
	 */
	async #hookViteDevServer(_forgeConfig, _appProcess) {
		// TODO: Hook vite dev server process into the appProcess lifecycle (e.g. 'close' event)
	}

	/**
	 * Kind of a lazy way of defining env-variable configuration for the app when
	 * packaged. Might re-consider and use a proper env file loader approach
	 * instead.
	 *
	 * @type {ForgeHookFn<'readPackageJson'>}
	 */
	async #addAppEnvToPackageJson(forgeConfig, packageJson) {
		packageJson.appEnv = {
			asar: forgeConfig.packagerConfig.asar,
		}

		return packageJson
	}

	/**
	 * Updates `packagerConfig.ignore` to exclude unnecessary files and
	 * directories from the final package output.
	 *
	 * @type {ForgeHookFn<'resolveForgeConfig'>}
	 */
	async #updatePackagerConfig(forgeConfig) {
		const existingIgnores = forgeConfig.packagerConfig.ignore

		const ignoresToAppend = [
			// Unnecessary directories
			/^\/(messages|data|docs|\.husky|patches)/,
			// Unecessary files
			/^\/(\.env\.template|.eslintcache|\.gitignore|.*\.config\.js|\.prettier.*|\.nvmrc)/,
		]

		if (existingIgnores) {
			if (typeof existingIgnores === 'function') {
				throw new Error(
					'Cannot override `packagerConfig.ignores` since it is a function',
				)
			}

			forgeConfig.packagerConfig.ignore = [
				...(Array.isArray(existingIgnores)
					? existingIgnores
					: [existingIgnores]),
				...ignoresToAppend,
			]
		} else {
			forgeConfig.packagerConfig.ignore = [...ignoresToAppend]
		}

		return forgeConfig
	}

	/**
	 * Builds the renderer app with Vite (similar to `npm run vite:build`).
	 *
	 * @type {ForgeHookFn<'prePackage'>}
	 */
	async #buildRender() {
		await build({
			root: fileURLToPath(new URL('./src/renderer', import.meta.url)),
		})
	}

	/**
	 * Moves the built renderer app from Vite's build output directory (usually
	 * `/dist/`) into the appropriate packaged app
	 * directory(`/<buildPath>/src/renderer/`).
	 *
	 * @type {ForgeHookFn<'packageAfterCopy'>}
	 */
	async #moveBuiltRender(_config, buildPath) {
		const outPath = path.join(buildPath, './src/renderer')

		try {
			await fs.access(outPath)
			await fs.rm(outPath, { recursive: true, force: true })
		} catch {
			// no-op if out path doesn't exist
		}

		await fs.mkdir(outPath)
		await fs.rename(path.join(buildPath, './dist/renderer'), outPath)
	}
}
/**
 * TODO: Remaining items to address:
 *
 * - Set up build identifiers
 *   (https://www.electronforge.io/config/configuration#build-identifiers)
 * - More thorough `packagerConfig.ignore` setting
 */

const NO_ASAR = !!process.env.NO_ASAR

/** @type {ForgeConfig['plugins']} */
const plugins = [
	new CoMapeoDesktopForgePlugin({}),
	// Fuses are used to enable/disable various Electron functionality
	// at package time, before code signing the application
	new FusesPlugin({
		version: FuseVersion.V1,
		[FuseV1Options.RunAsNode]: false,
		[FuseV1Options.EnableCookieEncryption]: true,
		[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
		[FuseV1Options.EnableNodeCliInspectArguments]: false,
		[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
		[FuseV1Options.OnlyLoadAppFromAsar]: !NO_ASAR,
	}),
]

if (!NO_ASAR) {
	plugins.push(new AutoUnpackNativesPlugin({}))
}

export default {
	packagerConfig: {
		asar: !NO_ASAR,
		name: 'CoMapeo Desktop',
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({}),
		new MakerZIP({}, ['darwin']),
		new MakerDeb({}, ['linux']),
		new MakerRpm({}, ['linux']),
	],
	plugins,
}
