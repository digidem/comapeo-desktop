import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import fs from 'node:fs/promises'
import { arch, platform } from 'node:os'
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
import { MakerAppImage } from '@reforged/maker-appimage'
import semver from 'semver'
import * as v from 'valibot'
import { build, createServer, type ViteDevServer } from 'vite'

import packageJSON from './package.json' with { type: 'json' }
import type { AppConfig, AppType } from './src/shared/app.ts'

import 'dotenv/config'

import type {
	ForgeConfig,
	ForgeConfigPlugin,
	ForgeHookFn,
} from '@electron-forge/shared-types'

const {
	APP_TYPE,
	ASAR,
	COMAPEO_DIAGNOSTICS_METRICS_URL,
	COMAPEO_METRICS_ACCESS_TOKEN,
	ONLINE_STYLE_URL,
	USER_DATA_PATH,
	VITE_MAPBOX_ACCESS_TOKEN,
} = v.parse(
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
		COMAPEO_METRICS_ACCESS_TOKEN: v.optional(v.string()),
		COMAPEO_DIAGNOSTICS_METRICS_URL: v.optional(v.pipe(v.string(), v.url())),
		ONLINE_STYLE_URL: v.optional(v.pipe(v.string(), v.url())),
		USER_DATA_PATH: v.optional(v.string()),
		VITE_MAPBOX_ACCESS_TOKEN: v.optional(v.string()),
	}),
	process.env,
)

const RENDERER_VITE_CONFIG_PATH = fileURLToPath(
	new URL('./src/renderer/vite.config.ts', import.meta.url),
)

type CoMapeoDesktopForgePluginConfig = {
	appVersion: string
	win32AppUserModelId: string
}

class CoMapeoDesktopForgePlugin extends PluginBase<CoMapeoDesktopForgePluginConfig> {
	name = 'comapeo-desktop'

	#viteDevServer: ViteDevServer | null = null

	constructor(config: CoMapeoDesktopForgePluginConfig) {
		super(config)

		process.on('exit', () => {
			this.#cleanUpVite()
		})

		process.on('SIGINT', () => {
			this.#cleanUpVite()
			process.exit()
		})
	}

	override getHooks() {
		return {
			generateAssets: [this.#createAppConfigFile],
			preStart: [this.#initViteDevServer],
			resolveForgeConfig: [this.#updatePackagerConfig],
			postStart: [this.#hookViteDevServer],
			prePackage: [this.#buildRender],
			packageAfterCopy: [this.#moveBuiltRendererApp],
		}
	}

	#createAppConfigFile: ForgeHookFn<'generateAssets'> = async (
		_forgeConfig,
		_platform,
		_version,
	) => {
		const outputPath = fileURLToPath(
			new URL('./app.config.json', import.meta.url),
		)

		// Use the `VITE_MAPBOX_ACCESS_TOKEN` to the online style URL
		// if it's a Mapbox style that doesn't already have an access token param
		const onlineStyleUrl = ONLINE_STYLE_URL
			? new URL(ONLINE_STYLE_URL)
			: undefined

		if (onlineStyleUrl) {
			if (onlineStyleUrl.host === 'api.mapbox.com') {
				if (
					!onlineStyleUrl.searchParams.has('access_token') &&
					VITE_MAPBOX_ACCESS_TOKEN
				) {
					onlineStyleUrl.searchParams.set(
						'access_token',
						VITE_MAPBOX_ACCESS_TOKEN,
					)
				} else {
					console.warn(
						'⚠️ Using a Mapbox map requires an access token. Either update the `ONLINE_STYLE_URL` env variable or specify the `VITE_MAPBOX_ACCESS_TOKEN` env variable',
					)
				}
			}
		}

		const appConfig: AppConfig = {
			appType: APP_TYPE,
			appVersion: this.config.appVersion,
			asar: ASAR,
			metrics: {
				accessToken: COMAPEO_METRICS_ACCESS_TOKEN,
				diagnosticsUrl: COMAPEO_DIAGNOSTICS_METRICS_URL,
			},
			onlineStyleUrl: onlineStyleUrl?.toString(),
			userDataPath: USER_DATA_PATH,
			win32AppUserModelId:
				process.platform === 'win32'
					? this.config.win32AppUserModelId
					: undefined,
		}

		await fs.writeFile(outputPath, JSON.stringify(appConfig))

		console.log(`✅ Created app config file at ${outputPath}`)
	}

	#initViteDevServer: ForgeHookFn<'preStart'> = async (_opts) => {
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
	 */
	#hookViteDevServer: ForgeHookFn<'postStart'> = async (
		_forgeConfig,
		appProcess,
	) => {
		appProcess.on('exit', () => {
			if (appProcess.restarted) return
			this.#cleanUpVite()
			process.exit()
		})
	}

	/**
	 * Updates `packagerConfig.ignore` to exclude unnecessary files and
	 * directories from the final package output.
	 */
	#updatePackagerConfig: ForgeHookFn<'resolveForgeConfig'> = async (
		forgeConfig,
	) => {
		const existingIgnores = forgeConfig.packagerConfig.ignore

		const ignoresToAppend = [
			// Unnecessary directories
			/^\/(\.github|\.husky|data|docs|messages|patches|\.tanstack|\.vscode|scripts)/,
			// Unnecessary files
			/^\/\.env/,
			/^\/.*\.config\.js$/,
			/^\/\.eslintcache$/,
			/^\/\.gitignore$/,
			/^\/\.nvmrc$/,
			/^\/\.prettierignore$/,
			/^\/\.tool-versions$/,
			/\.test\.+/,
			// NOTE: Omit prebuilds generated by node-gyp-build that are incompatible with the host platform + arch.
			// Since we do not cross-compile, the host determines the target we build for.
			// This prevents issues in the make step.
			new RegExp(`/node_modules/.+/prebuilds/(?!${platform()}-${arch()})`),
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
	 * Builds the renderer app with Vite (similar to `node --run vite:build`).
	 */
	#buildRender: ForgeHookFn<'prePackage'> = async () => {
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
	 */
	#moveBuiltRendererApp: ForgeHookFn<'packageAfterCopy'> = async (
		_config,
		buildPath,
	) => {
		const outPath = path.join(buildPath, './src/renderer')

		try {
			await fs.access(outPath)
			await fs.rm(outPath, { recursive: true, force: true })
		} catch {
			// no-op if out path doesn't exist
		}

		await fs.rename(path.join(buildPath, './dist/renderer'), outPath)
	}

	#cleanUpVite = () => {
		if (!this.#viteDevServer) return

		this.#viteDevServer.close()
		this.#viteDevServer = null
	}
}

const properties = getPropertiesForAppType(APP_TYPE)

const plugins: Array<ForgeConfigPlugin> = [
	new CoMapeoDesktopForgePlugin({
		appVersion: properties.appVersion,
		win32AppUserModelId: properties.win32AppUserModelId,
	}),
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

export default {
	packagerConfig: {
		asar: ASAR,
		// macOS: https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleidentifier
		appBundleId: properties.appBundleId,
		icon: './assets/icon',
		name: properties.appNameExternal,
		executableName: properties.executableName,
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel((arch) => ({
			iconUrl:
				'https://raw.githubusercontent.com/digidem/comapeo-desktop/232a55085e10f6b59f639aa86be0c46a71ed5110/assets/icon.ico',
			setupIcon: './assets/icon.ico',
			authors: 'Awana Digital',
			// https://www.electronforge.io/config/makers/squirrel.windows#spaces-in-the-app-name
			name: properties.win32ProductName,
			exe: `${properties.executableName}.exe`,
			setupExe: `${properties.executableName}-${properties.appVersion}-win32-${arch}-setup.exe`,
			noMsi: true,
		})),
		new MakerDMG({ icon: './assets/icon.icns' }),
		new MakerZIP(undefined, ['darwin']),
		new MakerAppImage(
			{
				options: {
					bin: properties.executableName,
					icon: './assets/icon.png',
					name: properties.appNameInternal,
					productName: properties.appNameExternal,
				},
			},
			['linux'],
		),
		new MakerDeb(
			{
				options: {
					bin: properties.executableName,
					icon: './assets/icon.png',
					name: properties.appNameInternal,
					productName: properties.appNameExternal,
				},
			},
			['linux'],
		),
		new MakerRpm(
			{
				options: {
					bin: properties.executableName,
					icon: './assets/icon.png',
					name: properties.appNameInternal,
					productName: properties.appNameExternal,
				},
			},
			['linux'],
		),
	],
	hooks: {
		readPackageJson: async (_config, packageJson) => {
			// We need to update this in order for Electron to use the desired name (it uses this field if present).
			// This leads to the desired outcome of properly isolated application data when having several apps on the same machine.
			packageJson.productName = properties.appNameExternal

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
		// NOTE: Creates an output directory at `out/distributables` that contains just the distributable assets.
		// Used by the [`create-builds`](./github/workflows/create-builds.yml) workflow
		postMake: async (config, makeResults) => {
			const destinationDir = path.join(
				config.outDir || './out',
				'distributables',
			)

			try {
				mkdirSync(destinationDir)
			} catch (err) {
				if (
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(err as any).code !== 'EEXIST'
				) {
					throw err
				}
			}

			const artifacts = makeResults.flatMap((result) => result.artifacts)

			await Promise.all(
				artifacts.map((a) =>
					fs.cp(a, path.join(destinationDir, path.basename(a))),
				),
			)
		},
	},
	plugins,
} satisfies ForgeConfig

function getPropertiesForAppType(appType: AppType): {
	appBundleId: string
	/**
	 * App name used for userfacing configurations e.g. `CoMapeo Desktop`
	 */
	appNameExternal: string
	/**
	 * App name used for generally non-userfacing configurations and
	 * identification e.g. `comapeo-desktop-rc`
	 */
	appNameInternal: string
	appVersion: string
	executableName: string
	win32AppUserModelId: string
	win32ProductName: string
} {
	const baseAppBundleId = 'com.comapeo'
	const baseExecutableName = 'comapeo-desktop'
	const baseAppNameExternal = packageJSON.productName
	const baseAppNameInternal = packageJSON.name

	const isMacOS = process.platform === 'darwin'

	switch (appType) {
		case 'development': {
			const appTypeSuffix = 'dev'
			const appNameExternal = `${baseAppNameExternal} Dev`
			const appNameInternal = `${baseAppNameInternal}-${appTypeSuffix}`

			const {
				productName: win32ProductName,
				appUserModelId: win32AppUserModelId,
			} = getWin32PackagingStrings({ appNameExternal, appNameInternal })

			const appVersion = getAppVersion({
				version: packageJSON.version,
				appType,
				appTypeSuffix,
			})

			return {
				appBundleId: `${baseAppBundleId}.${appTypeSuffix}`,
				appNameExternal,
				appNameInternal,
				appVersion,
				executableName: isMacOS
					? appNameExternal
					: `${baseExecutableName}-${appTypeSuffix}`,
				win32AppUserModelId,
				win32ProductName,
			}
		}
		case 'internal': {
			const appTypeSuffix = 'internal'
			const appNameExternal = `${baseAppNameExternal} Internal`
			const appNameInternal = `${baseAppNameInternal}-${appTypeSuffix}`

			const {
				productName: win32ProductName,
				appUserModelId: win32AppUserModelId,
			} = getWin32PackagingStrings({ appNameExternal, appNameInternal })

			const appVersion = getAppVersion({
				version: packageJSON.version,
				appType,
				appTypeSuffix,
			})

			return {
				appBundleId: `${baseAppBundleId}.${appTypeSuffix}`,
				appNameExternal,
				appNameInternal,
				appVersion,
				executableName: isMacOS
					? appNameExternal
					: `${baseExecutableName}-${appTypeSuffix}`,
				win32AppUserModelId,
				win32ProductName,
			}
		}
		case 'release-candidate': {
			const appTypeSuffix = 'rc'
			const appNameExternal = `${baseAppNameExternal} RC`
			const appNameInternal = `${baseAppNameInternal}-${appTypeSuffix}`

			const {
				productName: win32ProductName,
				appUserModelId: win32AppUserModelId,
			} = getWin32PackagingStrings({ appNameExternal, appNameInternal })

			const appVersion = getAppVersion({
				version: packageJSON.version,
				appType,
				appTypeSuffix,
			})

			return {
				appBundleId: `${baseAppBundleId}.${appTypeSuffix}`,
				appNameExternal,
				appNameInternal,
				appVersion,
				executableName: isMacOS
					? appNameExternal
					: `${baseExecutableName}-${appTypeSuffix}`,
				win32AppUserModelId,
				win32ProductName,
			}
		}
		case 'production': {
			const {
				productName: win32ProductName,
				appUserModelId: win32AppUserModelId,
			} = getWin32PackagingStrings({
				appNameExternal: baseAppNameExternal,
				appNameInternal: baseAppNameInternal,
			})

			const appVersion = getAppVersion({
				version: packageJSON.version,
				appType,
			})

			return {
				appBundleId: baseAppBundleId,
				appNameExternal: baseAppNameExternal,
				appNameInternal: baseAppNameInternal,
				appVersion,
				executableName: isMacOS ? baseAppNameExternal : baseExecutableName,
				win32AppUserModelId,
				win32ProductName,
			}
		}
	}
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
 */
function getAppVersion(options: {
	version: string
	appType: AppType
	appTypeSuffix?: string
}) {
	const commitSHA = (
		process.env.BUILD_SHA || execSync('git rev-parse HEAD').toString().trim()
	).slice(0, 7)

	const parsedVersion = semver.parse(options.version)

	if (!parsedVersion) {
		throw new Error(`Unable to parse version: ${options.version}`)
	}

	const { major, minor, patch } = parsedVersion

	if (options.appType === 'development') {
		return options.appTypeSuffix
			? `${major}.${minor}.${patch}-${options.appTypeSuffix}+${commitSHA}`
			: `${major}.${minor}.${patch}+${commitSHA}`
	} else if (
		options.appType === 'internal' ||
		options.appType === 'release-candidate'
	) {
		return options.appTypeSuffix
			? `${minor}.${patch}-${options.appTypeSuffix}+${commitSHA}`
			: `${minor}.${patch}+${commitSHA}`
	}

	return `${minor}.${patch}`
}

/**
 * Derives the relevant components of the package name used for Win32
 * applications.
 *
 * https://learn.microsoft.com/en-us/windows/win32/shell/appids
 */
function getWin32PackagingStrings({
	appNameExternal,
	appNameInternal,
}: {
	appNameExternal: string
	appNameInternal: string
}): {
	productName: string
	appUserModelId: string
} {
	const productName = appNameExternal.replaceAll(' ', '')

	return {
		productName,
		// Documentation in https://www.electronforge.io/config/makers/squirrel.windows#spaces-in-the-app-name
		// is slightly incorrect: https://github.com/electron/forge/issues/3118
		appUserModelId: `com.squirrel.${productName}.${appNameInternal}`,
	}
}
