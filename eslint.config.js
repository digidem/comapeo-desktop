// @ts-check

// import reactRecommended from 'eslint-plugin-react/configs/recommended.js'
import react from '@eslint-react/eslint-plugin'
import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  // TypeScript
  {
    // TODO: Enable for stricter, type-based linting: https://typescript-eslint.io/getting-started/typed-linting
    // extends: tseslint.configs.recommendedTypeChecked,
    // languageOptions: {
    //   parserOptions: {
    //     project: true,
    //     tsconfigRootDir: import.meta.dirname,
    //   },
    // },
    extends: tseslint.configs.recommended,
    rules: {
      '@typescript-eslint/ban-ts-comment': 1,
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
  // React
  {
    files: ['src/renderer/**/*.{js,ts,jsx,tsx}'],
    ...react.configs.recommended,
  },
  // Applies to browser-like contexts
  {
    files: ['src/preload/**/*', 'src/renderer/**/*'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  // Applies to node-like contexts
  {
    files: ['src/main/**/*', 'src/service/**/*'],
    languageOptions: {
      globals: {
        ...globals.node,
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
  { ignores: ['.prettierrc.js', '.vite', '*.config.*js', 'out'] },
)
