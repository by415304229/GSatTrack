module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Basic ESLint rules
    'no-empty': 'warn',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // React rules
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    
    // TypeScript specific rules
    '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true }],
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
    }],
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
      fixStyle: 'inline-type-imports',
    }],
    '@typescript-eslint/no-unused-vars': ['warn', {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
    }],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
    ],
    
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    // Override for test files
    {
      files: ['**/__tests__/**/*', '**/*.test.*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/unbound-method': 'off',
      },
    },
    // Override for CSS and style files
    {
      files: ['**/*.css', '**/*.scss', '**/*.sass', '**/*.less'],
      rules: {
        // Disable all ESLint rules for style files
        'no-undef': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};