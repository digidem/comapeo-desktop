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
 * @extends {PluginBase<{}>}
 */
class PackageRendererPlugin extends PluginBase {
	name = 'comapeo-package-renderer'

	/**
	 * @param {{}} config
	 */
	constructor(config) {
		super(config)
	}
	/**
	 * @override
	 */
	getHooks() {
		return {
			prePackage: [this.#buildRender],
			packageAfterCopy: [this.#moveBuiltRender],
			readPackageJson: [this.#addAppEnvToPackageJson],
		}
	}

	/** @type {import('@electron-forge/shared-types').ForgeMutatingHookFn<'readPackageJson'>} */
	async #addAppEnvToPackageJson(forgeConfig, packageJson) {
		packageJson.appEnv = {
			prod: true,
			asar: forgeConfig.packagerConfig.asar,
		}

		return packageJson
	}

	/** @type {import('@electron-forge/shared-types').ForgeSimpleHookFn<'prePackage'>} */
	async #buildRender() {
		await build({
			root: fileURLToPath(new URL('./src/renderer', import.meta.url)),
		})
	}

	/** @type {import('@electron-forge/shared-types').ForgeSimpleHookFn<'packageAfterCopy'>} */
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

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
export default {
	packagerConfig: {
		// TODO: Electron does some fs mangling to work in asar. Setting this to false (and having the app code set the process.noAsar)
		// doesn't seem to work when running the packaged app.
		asar: true,
		name: 'CoMapeo Desktop',
		// TODO: may need to disable pruning depending on how deps are resolved
		// prune: false,
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({}),
		new MakerZIP({}, ['darwin']),
		new MakerDeb({}, ['linux']),
		new MakerRpm({}, ['linux']),
	],
	plugins: [
		new PackageRendererPlugin({}),
		// Can only be used when packagerConfig.asar is enabled
		new AutoUnpackNativesPlugin({}),
		// new AutoUnpackNativesPlugin({}),
		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
}
