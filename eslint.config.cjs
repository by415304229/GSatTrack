// ESLint configuration using the new flat config format for ESLint v9
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

// Create a basic configuration that can handle TypeScript and JSX
module.exports = [
  // Ignore patterns
  { ignores: ['node_modules/', 'dist/', 'build/', 'coverage/', '*.config.js', '*.config.cjs', '*.config.mjs', '*.config.ts', '*.tsbuildinfo', '.DS_Store', 'Thumbs.db', '*.env', '*.env.*'] },
  
  // For TypeScript and TSX files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Basic ESLint rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-debugger': 'warn',
    },
  },
  
  // For JavaScript and JSX files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Basic ESLint rules
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'no-debugger': 'warn',
    },
  },
];