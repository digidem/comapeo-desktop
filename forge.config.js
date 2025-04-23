import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerDMG } from '@electron-forge/maker-dmg'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'
import { PluginBase } from '@electron-forge/plugin-base'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { FuseV1Options, FuseVersion } from '@electron/fuses'
import { build, createServer } from 'vite'

import 'dotenv/config'

/**
 * @import {ForgeConfig, ForgeHookFn} from '@electron-forge/shared-types'
 * @import {ViteDevServer} from 'vite'
 */

const RENDERER_VITE_CONFIG_PATH = fileURLToPath(
	new URL('./src/renderer/vite.config.js', import.meta.url),
)

const PRODUCTION_ENV_FILE_PATH = fileURLToPath(
	new URL('./.env.production', import.meta.url),
)

/**
 * @extends {PluginBase<{}>}
 */
class CoMapeoDesktopForgePlugin extends PluginBase {
	name = 'comapeo-desktop'

	/** @type {ViteDevServer | null} */
	#viteDevServer = null

	/**
	 * @param {{}} config
	 */
	constructor(config) {
		super(config)

		process.on('exit', () => {
			this.#cleanUpVite()
		})

		process.on('SIGINT', () => {
			this.#cleanUpVite()
			process.exit()
		})
	}

	/**
	 * @type {PluginBase<{}>['getHooks']}
	 * @override
	 */
	getHooks() {
		return {
			preStart: [this.#initViteDevServer],
			resolveForgeConfig: [this.#updatePackagerConfig],
			postStart: [this.#hookViteDevServer],
			prePackage: [this.#buildRender],
			packageAfterCopy: [this.#moveBuiltRender],
		}
	}

	/**
	 * @type {ForgeHookFn<'preStart'>}
	 */
	#initViteDevServer = async (_opts) => {
		if (this.#viteDevServer) return

		const server = await createServer({
			configFile: RENDERER_VITE_CONFIG_PATH,
		})

		try {
			await server.listen()
			console.log('Started Vite dev server')
			server.printUrls()
			this.#viteDevServer = server
		} catch {
			console.log('Vite dev server already running.')
		}
	}

	/**
	 * Coordinates Vite with the Electron app process
	 *
	 * @type {ForgeHookFn<'postStart'>}
	 */
	#hookViteDevServer = async (_forgeConfig, appProcess) => {
		appProcess.on('exit', () => {
			if (appProcess.restarted) return
			this.#cleanUpVite()
			process.exit()
		})
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
			/^\/(\.github|\.husky|assets|data|docs|messages|patches)/,
			// Unnecessary files
			/^\/\.env/,
			/^\/.*\.config\.js$/,
			/^\/\.eslintcache$/,
			/^\/\.gitignore$/,
			/^\/\.nvmrc$/,
			/^\/\.prettierignore$/,
			/^\/\.tool-versions$/,
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
			configFile: RENDERER_VITE_CONFIG_PATH,
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

		await fs.mkdir(outPath, { recursive: true })
		await fs.rename(path.join(buildPath, './dist/renderer'), outPath)

		try {
			await fs.copyFile(
				PRODUCTION_ENV_FILE_PATH,
				path.join(buildPath, '.env.production'),
			)
		} catch (err) {
			throw new Error(
				'Failed to copy over production env file. Confirm that it is present.',
				{ cause: err },
			)
		}
	}

	#cleanUpVite = () => {
		if (!this.#viteDevServer) return

		this.#viteDevServer.close()
		this.#viteDevServer = null
	}
}

/** @type {boolean} */
let ASAR_ENABLED

if (process.env.ASAR) {
	if (process.env.ASAR === 'true') {
		ASAR_ENABLED = true
	} else if (process.env.ASAR === 'false') {
		ASAR_ENABLED = false
	} else {
		throw new Error("ASAR env variable must be 'true' or 'false'")
	}
} else {
	ASAR_ENABLED = true
}

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
		[FuseV1Options.OnlyLoadAppFromAsar]: ASAR_ENABLED,
	}),
]

if (ASAR_ENABLED) {
	plugins.push(new AutoUnpackNativesPlugin({}))
}

/** @type {ForgeConfig} */
export default {
	packagerConfig: {
		asar: ASAR_ENABLED,
		name: 'CoMapeo Desktop',
		icon: './assets/icon',
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({
			setupIcon: './assets/icon.ico',
		}),
		new MakerDMG({
			icon: './assets/icon.icns',
		}),
		new MakerZIP({}, ['darwin']),
		new MakerDeb(
			{
				options: {
					icon: './assets/icon.png',
				},
			},
			['linux'],
		),
		new MakerRpm(
			{
				options: { icon: './assets/icon.png' },
			},
			['linux'],
		),
	],
	plugins,
}
