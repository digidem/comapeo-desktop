import { fileURLToPath } from 'node:url'
import react from '@eslint-react/eslint-plugin'
import { includeIgnoreFile } from '@eslint/compat'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
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
		...react.configs['recommended-typescript'],
		name: 'electron-renderer',
		files: ['src/renderer/**/*'],
		languageOptions: {
			globals: { ...globals.browser },
			parser: tseslint.parser,
		},
	},
	// Node or Node-like processes
	{
		name: 'node',
		files: ['**/*.config.js', 'src/main/**/*', 'src/services/**/*'],
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
		ignores: ['src/renderer/src/routeTree.gen.ts'],
	},
	// Global ignores
	includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
)
