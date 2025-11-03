import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@eslint-react/eslint-plugin'
import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
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
	{
		name: 'typescript',
		extends: tseslint.configs.recommended,
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
		},
	},
	// Preload environment
	{
		name: 'electron-preload',
		files: ['src/preload/**/*'],
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
		rules: {
			'react-hooks/exhaustive-deps': 'error',
			'react-hooks/rules-of-hooks': 'error',
		},
		languageOptions: {
			globals: { ...globals.browser },
			parser: tseslint.parser,
		},
		ignores: ['src/renderer/src/generated/routeTree.gen.ts'],
	},
	// Node or Node-like processes
	{
		name: 'node',
		files: [
			'**/*.config.{js,ts}',
			'src/main/**/*',
			'src/services/**/*',
			'scripts/*',
		],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.nodeBuiltin,
				...globals.worker,
			},
		},
	},
	// Applies to all contexts
	{
		name: 'shared',
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
		},
	},
)
