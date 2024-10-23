/** @type {import('prettier').Config} */
export default {
	tabWidth: 2,
	useTabs: true,
	semi: false,
	singleQuote: true,
	arrowParens: 'always',
	trailingComma: 'all',
	plugins: ['@ianvs/prettier-plugin-sort-imports'],
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
	importOrderTypeScriptVersion: '5.6.3',
	// TODO: Uncomment when a release newer than 4.3.1 is out
	// importOrderCaseSensitive: true,
}
