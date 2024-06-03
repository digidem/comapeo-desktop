// @ts-check

/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
  semi: false,
  singleQuote: true,
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
}
