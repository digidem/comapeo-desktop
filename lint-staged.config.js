/** @type {import('lint-staged').Config} */
export default {
	'*': ['prettier --write --ignore-unknown --cache'],
	'src/main/**/*.{js,jsx,ts,tsx}': 'npm run intl:extract:main',
	'src/renderer/**/*.{js,jsx,ts,tsx}': 'npm run intl:extract:renderer',
}