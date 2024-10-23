import react from '@eslint-react/eslint-plugin'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	// Preload environment
	{
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
		files: ['src/renderer/**/*'],
		...react.configs.recommended,
		languageOptions: {
			globals: { ...globals.browser },
			parser: tseslint.parser,
		},
	},
	// Node or Node-like processes
	{
		files: ['*.config.js', 'src/main/**/*'],
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
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
		},
	},
	// Global ignores
	{ ignores: ['out'] },
)
