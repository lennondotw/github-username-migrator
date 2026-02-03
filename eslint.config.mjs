import cspellPlugin from '@cspell/eslint-plugin';
import eslintJsPlugin from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import tsEslint from 'typescript-eslint';

/** @type {string[]} */
const TS_FILES = ['**/{,.}*.{,c,m}{j,t}s', '**/{,.}*.{,c,m}{j,t}sx'];

const typescriptConfigs = tsEslint.configs.strictTypeChecked.concat(tsEslint.configs.stylisticTypeChecked);

/**
 * @type {import('eslint').Linter.Config[]}
 */
const eslintConfig = [
  // config for all
  { ignores: ['**/node_modules/', '**/dist/'] },
  { linterOptions: { reportUnusedDisableDirectives: true } },

  // config for javascript/typescript code
  {
    files: TS_FILES,
    ...eslintJsPlugin.configs.recommended,
  },
  {
    files: TS_FILES,
    plugins: {
      '@typescript-eslint': tsEslint.plugin,
    },
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.node, ...globals.es2020 },
    },
  },
  ...typescriptConfigs.map((config) => ({
    files: TS_FILES,
    ...config,
  })),
  {
    files: TS_FILES,
    ...eslintConfigPrettier,
  },
  {
    files: TS_FILES,
    plugins: { prettier: prettierPlugin },
    rules: { 'prettier/prettier': 'error' },
  },
  {
    files: TS_FILES,
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // React/JSX configuration
  {
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  // Relax type checking for test files using bun:test (types are incomplete)
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },

  // config for all
  {
    plugins: { '@cspell': cspellPlugin },
    rules: {
      '@cspell/spellchecker': [
        'warn',
        /** @type {import('@cspell/eslint-plugin').Options} */ ({
          autoFix: true,
          generateSuggestions: true,
          numSuggestions: 3,
          configFile: fileURLToPath(new URL('./cspell.config.yaml', import.meta.url)),
        }),
      ],
    },
  },
];

export default eslintConfig;
