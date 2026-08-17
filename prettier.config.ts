import type { Config } from 'prettier'

export default {
	tabWidth: 2,
	useTabs: true,
	semi: false,
	singleQuote: true,
	arrowParens: 'always',
	trailingComma: 'all',
	plugins: ['prettier-plugin-jsdoc', '@ianvs/prettier-plugin-sort-imports'],
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
	importOrderTypeScriptVersion: '7.0.2',
	importOrderCaseSensitive: true,
	/**
	 * Configuration for prettier-plugin-jsdoc
	 */
	jsdocBracketSpacing: true,
	jsdocCommentLineStrategy: 'keep',
	jsdocAddDefaultToDescription: false,
	jsdocSeparateReturnsFromParam: true,
} satisfies Config
