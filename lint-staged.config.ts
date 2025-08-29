import type { Configuration } from 'lint-staged'

export default {
	'*': ['prettier --write --ignore-unknown --cache'],
	'src/main/**/*.{js,jsx,ts,tsx}': 'node --run intl:main:extract',
	'src/renderer/**/*.{js,jsx,ts,tsx}': 'node --run intl:renderer:extract',
} satisfies Configuration
