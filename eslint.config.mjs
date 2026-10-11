import babelParser from '@babel/eslint-parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/**',
      'generated/**',
      '.next/**',
      '.keystone/**',
      'tmp/**',
    ],
  },
  prettierConfig,
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: { parserOpts: { plugins: ['typescript', 'jsx'] } },
      },
    },
    plugins: { prettier },
    rules: { 'prettier/prettier': ['error', { endOfLine: 'auto' }] },
  },
];
