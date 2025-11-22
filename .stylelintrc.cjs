module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended'
  ],
  plugins: [
    'stylelint-order'
  ],
  rules: {
    // 禁止使用未知属性
    'property-no-unknown': true,
    // 允许使用!important（如果需要）
    'declaration-no-important': null,
    // 允许Tailwind CSS的@layer指令
    'at-rule-no-unknown': [true, {
      ignoreAtRules: ['tailwind', 'layer', 'apply', 'variants', 'responsive', 'screen']
    }],
    // 忽略空文件警告
    'no-empty-source': null,
    // 禁用一些对现代开发不适用的规则
    'no-descending-specificity': null,
    'declaration-block-no-redundant-longhand-properties': null
  },
  // 忽略特定文件和目录
  ignoreFiles: [
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    'public/**',
    '**/*.config.js',
    '**/*.config.cjs',
    '**/*.config.ts',
    '**/*.config.mjs',
    '**/*.js',
    '**/*.ts',
    '**/*.tsx',
    '**/*.jsx',
    '**/*.json'
  ],
  // 指定要检查的文件
  files: ['**/*.css', '**/*.scss', '**/*.sass', '**/*.less', '**/*.styl']
};