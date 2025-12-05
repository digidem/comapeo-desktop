import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@eslint-react/eslint-plugin'
import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const gitignorePath = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'.gitignore',
)

const gitExcludePath = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'.git',
	'info',
	'exclude',
)

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	includeIgnoreFile(gitExcludePath),
	js.configs.recommended,
	// Tooling
	{
		name: 'Tooling',
		files: ['**/*.config.{js,ts}', 'scripts/*'],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.nodeBuiltin,
				...globals.worker,
			},
		},
	},
	{
		name: 'typescript',
		extends: tseslint.configs.recommended,
		plugins: {
			'no-relative-import-paths': noRelativeImportPaths,
		},
		rules: {
			'@typescript-eslint/array-type': ['warn', { default: 'generic' }],
			// Allow unused vars if prefixed with `_` (https://typescript-eslint.io/rules/no-unused-vars/)
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
			'no-relative-import-paths/no-relative-import-paths': [
				'error',
				{
					allowSameFolder: true,
					rootDir: 'src/main',
					prefix: '#main',
					allowedDepth: 1,
				},
			],
		},
	},
	{
		name: 'electron-main',
		files: ['src/main/**/*'],
		plugins: {
			'no-relative-import-paths': noRelativeImportPaths,
		},
		rules: {
			'no-relative-import-paths/no-relative-import-paths': [
				'error',
				{
					allowSameFolder: true,
					rootDir: 'src/main',
					prefix: '#main',
					allowedDepth: 1,
				},
			],
		},
		languageOptions: {
			globals: {
				...globals.node,
				...globals.nodeBuiltin,
				...globals.worker,
			},
		},
	},
	{
		name: 'electron-services',
		files: ['src/services/**/*'],
		plugins: {
			'no-relative-import-paths': noRelativeImportPaths,
		},
		rules: {
			'no-relative-import-paths/no-relative-import-paths': [
				'error',
				{
					allowSameFolder: true,
					rootDir: 'src/services',
					prefix: '#services',
					allowedDepth: 1,
				},
			],
		},
		languageOptions: {
			globals: {
				...globals.node,
				...globals.nodeBuiltin,
				...globals.worker,
			},
		},
	},
	// Preload environment
	{
		name: 'electron-preload',
		files: ['src/preload/**/*'],
		plugins: {
			'no-relative-import-paths': noRelativeImportPaths,
		},
		languageOptions: {
			globals: {
				// https://www.electronjs.org/docs/latest/tutorial/tutorial-preload#augmenting-the-renderer-with-a-preload-script
				...globals.node,
				...globals.browser,
				Buffer: globals.nodeBuiltin.Buffer,
				process: globals.nodeBuiltin.process,
				clearImmediate: globals.nodeBuiltin.clearImmediate,
				setImmediate: globals.nodeBuiltin.setImmediate,
			},
		},
		rules: {
			// Preload scripts may use `require()` for accessing Electron APIs
			// https://www.electronjs.org/docs/latest/tutorial/esm#sandboxed-preload-scripts-cant-use-esm-imports
			'@typescript-eslint/no-require-imports': 'off',
			'no-relative-import-paths/no-relative-import-paths': [
				'error',
				{
					allowSameFolder: true,
					rootDir: 'src/preload',
					prefix: '#preload',
					allowedDepth: 1,
				},
			],
		},
	},
	// Renderer process
	{
		name: 'electron-renderer',
		files: ['src/renderer/**/*'],
		extends: [
			react.configs['recommended-typescript'],
			pluginRouter.configs['flat/recommended'],
			pluginReactHooks.configs.flat.recommended,
			pluginQuery.configs['flat/recommended'],
			pluginReactRefresh.configs.vite,
		],
		plugins: {
			'no-relative-import-paths': noRelativeImportPaths,
		},
		rules: {
			'react-hooks/exhaustive-deps': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'no-relative-import-paths/no-relative-import-paths': [
				'error',
				{
					allowSameFolder: true,
					rootDir: 'src/renderer',
					prefix: '#renderer',
					allowedDepth: 1,
				},
			],
		},
		languageOptions: {
			globals: { ...globals.browser },
			parser: tseslint.parser,
		},
		ignores: ['src/renderer/src/generated/routeTree.gen.ts'],
	},
)
