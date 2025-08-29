// NOTE: This is not a TypeScript file due to lack of support
// from the VSCode extension as of writing
// https://github.com/prettier/prettier-vscode/issues/3623

/** @type {import('prettier').Config} */
export default {
	tabWidth: 2,
	useTabs: true,
	semi: false,
	singleQuote: true,
	arrowParens: 'always',
	trailingComma: 'all',
	plugins: [
		'@ianvs/prettier-plugin-sort-imports',
		'./node_modules/prettier-plugin-jsdoc/dist/index.js',
	],
	/**
	 * Configuration @ianvs/prettier-plugin-sort-imports
	 */
	// Mostly inspired by examples from https://github.com/IanVS/prettier-plugin-sort-imports?tab=readme-ov-file#importorder
	importOrder: [
		'<BUILT_IN_MODULES>',
		'^react$',
		'<THIRD_PARTY_MODULES>',
		'',
		'^(?!.*[.]css$)[./].*$',
		'',
		'.css$',
	],
	importOrderTypeScriptVersion: '5.9.2',
	importOrderCaseSensitive: true,
	/**
	 * Configuration for prettier-plugin-jsdoc
	 */
	jsdocCommentLineStrategy: 'keep',
	jsdocAddDefaultToDescription: false,
	jsdocSeparateReturnsFromParam: true,
}
