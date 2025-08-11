import { execSync } from 'node:child_process'
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
import { PublisherGithub } from '@electron-forge/publisher-github'
import { FuseV1Options, FuseVersion } from '@electron/fuses'
import dotenv from 'dotenv'
import semver from 'semver'
import * as v from 'valibot'
import { build, createServer } from 'vite'

import packageJSON from './package.json' with { type: 'json' }

/**
 * @import {ForgeConfig, ForgeHookFn} from '@electron-forge/shared-types'
 * @import {ViteDevServer} from 'vite'
 */

const dotenvOutput = dotenv.config({
	path: fileURLToPath(new URL('./.env', import.meta.url)),
	quiet: process.env.NODE_ENV !== 'development',
})

if (dotenvOutput.error) {
	throw dotenvOutput.error
}

const { APP_TYPE, ASAR, ONLINE_STYLE_URL, USER_DATA_PATH } = v.parse(
	v.object({
		APP_TYPE: v.optional(
			v.union(
				[
					v.literal('development'),
					v.literal('internal'),
					v.literal('release-candidate'),
					v.literal('production'),
				],
				"APP_TYPE env variable must be 'development', 'internal', 'release-candidate', or 'production'",
			),
			'development',
		),
		ASAR: v.optional(
			v.pipe(
				v.union(
					[v.literal('true'), v.literal('false')],
					"ASAR env variable must be 'true' or 'false'",
				),
				v.transform((v) => v === 'true'),
			),
			'true',
		),
		ONLINE_STYLE_URL: v.pipe(v.string(), v.url()),
		USER_DATA_PATH: v.optional(v.string()),
	}),
	process.env,
)

const RENDERER_VITE_CONFIG_PATH = fileURLToPath(
	new URL('./src/renderer/vite.config.js', import.meta.url),
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
			generateAssets: [this.#createAppConfigFile],
			preStart: [this.#initViteDevServer],
			resolveForgeConfig: [this.#updatePackagerConfig],
			postStart: [this.#hookViteDevServer],
			prePackage: [this.#buildRender],
			packageAfterCopy: [this.#moveBuiltRendererApp],
		}
	}

	/**
	 * @type {ForgeHookFn<'generateAssets'>}
	 */
	#createAppConfigFile = async (_forgeConfig, _platform, _version) => {
		const outputPath = fileURLToPath(
			new URL('./app.config.json', import.meta.url),
		)

		/** @type {import('./src/shared/app').AppConfig} */
		const appConfig = {
			appType: APP_TYPE,
			asar: ASAR,
			onlineStyleUrl: ONLINE_STYLE_URL,
			userDataPath: USER_DATA_PATH,
			appVersion: getAppVersion(packageJSON.version, APP_TYPE),
		}

		await fs.writeFile(outputPath, JSON.stringify(appConfig))

		console.log(`✅ Created app config file at ${outputPath}`)
	}

	/**
	 * @type {ForgeHookFn<'preStart'>}
	 */
	#initViteDevServer = async (_opts) => {
		if (APP_TYPE !== 'development') {
			throw new Error(
				`Cannot run the Vite dev server and have APP_TYPE environment variable set to something other than 'develop'`,
			)
		}

		if (this.#viteDevServer) return

		const server = await createServer({ configFile: RENDERER_VITE_CONFIG_PATH })

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
			/^\/(\.github|\.husky|assets|data|docs|messages|patches|\.tanstack|\.vscode|scripts)/,
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
		if (APP_TYPE === 'development') {
			throw new Error(
				"Cannot package app with APP_TYPE environment variable set to 'development'. You probably should use 'internal' instead.",
			)
		}

		await build({ configFile: RENDERER_VITE_CONFIG_PATH, mode: APP_TYPE })
	}

	/**
	 * Moves the built renderer app from Vite's build output directory (usually
	 * `/dist/`) into the appropriate packaged app directory
	 * (`/<buildPath>/src/renderer/`).
	 *
	 * @type {ForgeHookFn<'packageAfterCopy'>}
	 */
	async #moveBuiltRendererApp(_config, buildPath) {
		const outPath = path.join(buildPath, './src/renderer')

		try {
			await fs.access(outPath)
			await fs.rm(outPath, { recursive: true, force: true })
		} catch {
			// no-op if out path doesn't exist
		}

		await fs.mkdir(outPath, { recursive: true })
		await fs.rename(path.join(buildPath, './dist/renderer'), outPath)
	}

	#cleanUpVite = () => {
		if (!this.#viteDevServer) return

		this.#viteDevServer.close()
		this.#viteDevServer = null
	}
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
		[FuseV1Options.OnlyLoadAppFromAsar]: ASAR,
	}),
]

if (ASAR) {
	plugins.push(new AutoUnpackNativesPlugin({}))
}

const APP_TYPE_SUFFIXES = getAppTypeSuffixes(APP_TYPE)
const APP_BUNDLE_ID = APP_TYPE_SUFFIXES.id
	? `com.comapeo.${APP_TYPE_SUFFIXES.id}`
	: `com.comapeo`
const APPLICATION_NAME = `${packageJSON.productName}${APP_TYPE_SUFFIXES.name}`

/** @type {ForgeConfig} */
export default {
	packagerConfig: {
		asar: ASAR,
		// macOS: https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleidentifier
		appBundleId: APP_BUNDLE_ID,
		icon: './assets/icon',
		name: APPLICATION_NAME,
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({ setupIcon: './assets/icon.ico' }),
		new MakerDMG({ icon: './assets/icon.icns' }),
		new MakerZIP(undefined, ['darwin']),
		new MakerDeb({ options: { icon: './assets/icon.png' } }, ['linux']),
		new MakerRpm({ options: { icon: './assets/icon.png' } }, ['linux']),
	],
	publishers: [
		new PublisherGithub({
			draft: true,
			force: true,
			generateReleaseNotes: true,
			repository: { owner: 'digidem', name: 'comapeo-desktop' },
			tagPrefix: 'v',
		}),
	],
	hooks: {
		readPackageJson: async (_config, packageJson) => {
			// We need to update this in order for Electron to use the desired name (it uses this field if present).
			// This leads to the desired outcome of properly isolated application data when having several apps on the same machine.
			packageJson.productName = APPLICATION_NAME

			// NOTE: Kind of hacky but has the following desired effects:
			//   - Uses the correct version for the file name of the asset that is generated in Forge's `make` step.
			//   - Uses the correct version for the GitHub release that the GitHub publisher should upload builds to.
			//
			// TODO: We should probably just stop using the GitHub publisher and remove the need for this in favor of using GitHub Actions.
			if (APP_TYPE === 'production') {
				const parsed = semver.parse(packageJson.version)

				if (!parsed) {
					throw new Error(
						`Unable to parse package.json version: ${packageJson.version}`,
					)
				}

				const { minor, patch } = parsed

				// NOTE: We update the version here to align with our release version format (i.e. no major).
				// As noted in the Forge documentation, this does not affect the application metadata that's used by Forge
				// when packaging (https://www.electronforge.io/config/hooks#readpackagejson).
				packageJson.version = `${minor}.${patch}`
			}

			return packageJson
		},
	},
	plugins,
}

/**
 * @param {import('./src/shared/app').AppType} appType
 */
function getAppTypeSuffixes(appType) {
	let result = { id: '', name: '' }

	switch (appType) {
		case 'development': {
			result = { id: 'dev', name: ' Dev' }
			break
		}
		case 'internal': {
			result = { id: 'internal', name: ' Internal' }
			break
		}
		case 'release-candidate': {
			result = { id: 'rc', name: ' RC' }
		}
	}

	return result
}

/**
 * Get the user-facing app version. This is different from the versions used by
 * `@electron/packager` internally, which needs to conform to platform-specific
 * requirements around format:
 *
 * - MacOS:
 *   https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleversion
 *   and //
 *   https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleshortversionstring
 * - Windows:
 *   https://learn.microsoft.com/en-us/windows/win32/menurc/versioninfo-resource#parameters
 *
 * @param {string} version
 * @param {import('./src/shared/app').AppType} appType
 */
function getAppVersion(version, appType) {
	const commitSHA = (
		process.env.BUILD_SHA || execSync('git rev-parse HEAD').toString().trim()
	).slice(0, 7)

	const parsedVersion = semver.parse(version)

	if (!parsedVersion) {
		throw new Error(`Unable to parse version: ${version}`)
	}

	const { major, minor, patch } = parsedVersion

	if (appType === 'development') {
		return `${major}.${minor}.${patch}-${APP_TYPE_SUFFIXES.id}+${commitSHA}`
	} else if (appType === 'internal' || appType === 'release-candidate') {
		return `${minor}.${patch}-${APP_TYPE_SUFFIXES.id}+${commitSHA}`
	}

	return `${minor}.${patch}`
}
