// ESLint configuration using the new flat config format for ESLint v9
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

module.exports = [
  // Common configuration
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'build/**'],
  },
  // Base configuration
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Base ESLint rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
    },
  },
  // React configuration
  {
    files: ['**/*.{jsx,tsx}'],
    languageOptions: {
      parserOptions: {
        jsx: true,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React specific rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // TypeScript configuration for source files and types.ts
  {
    files: ['src/**/*.{ts,tsx}', 'types.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript-specific rules - 禁用不需要的警告
      '@typescript-eslint/no-explicit-any': 'off', // 允许使用any类型
      '@typescript-eslint/explicit-function-return-type': 'off', // 不强制函数返回类型
      '@typescript-eslint/explicit-module-boundary-types': 'off', // 不强制模块边界类型
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      // 禁用命名规范检查 - 本项目不强制命名格式
      '@typescript-eslint/naming-convention': 'off',
    },
  },
  // TypeScript configuration for test files and config files (without project option)
  {
    files: ['tests/**/*.{ts,tsx}', 'vite.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // No project option for test files
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript-specific rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/naming-convention': 'off',
    },
  },
  // Test files configuration
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/__tests__/**'],
    rules: {
      'no-console': 'off',
      'no-debugger': 'off',
    },
  },
];