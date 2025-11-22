# Stylelint 配置说明

## 1. 配置概述

本项目使用 Stylelint 进行 CSS 文件的代码质量检查，但**不检查 JSX/TSX 文件中的嵌入式 CSS**。这个决定基于以下考虑：

- JSX/TSX 文件中的嵌入式 CSS（如 styled-components）需要专门的处理器支持，而目前的处理器配置可能导致检查结果不一致
- 为避免出现 "Unknown word" 或 "CssSyntaxError" 等错误，我们选择将 Stylelint 的检查范围限制在纯 CSS 相关文件
- ESLint 已经负责检查 TSX/JSX 文件的代码质量

## 2. 检查范围

目前 Stylelint 配置仅检查以下文件类型：
- `.css`
- `.scss`
- `.sass`
- `.less`
- `.styl`

**不检查**：
- `.tsx`
- `.jsx`

## 3. 命令行使用

### 检查 CSS 文件
```bash
npm run lint:css
```

### 自动修复 CSS 文件中的问题
```bash
npm run lint:css:fix
```

### 检查所有文件（包括 ESLint 和 Stylelint）
```bash
npm run lint
```

### 自动修复所有文件中的问题
```bash
npm run lint:fix
```

## 4. VSCode 配置

### 安装扩展
确保已安装以下 VSCode 扩展：
- [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)

### 自动修复配置
在 `.vscode/settings.json` 中，我们已配置了保存时自动修复：

```json
"editor.codeActionsOnSave": {
  "source.fixAll.stylelint": "explicit"
}
```

### 验证文件类型
Stylelint 插件已配置为验证以下文件类型：

```json
"stylelint.validate": [
  "css",
  "scss",
  "sass",
  "less",
  "stylus"
]
```

## 5. Vite 集成

项目的 Vite 配置中已集成 Stylelint 插件，会在开发时自动检查 CSS 文件。配置详情：

- 检查范围：仅 CSS 相关文件
- 启动时检查：已启用
- 保存时自动修复：已启用

## 6. 常见问题解答

### 为什么我的 JSX/TSX 文件中的 CSS 没有被检查？
Stylelint 目前不检查 JSX/TSX 文件中的嵌入式 CSS，这是为了避免语法错误和配置不一致的问题。

### 如何确保插件显示结果与实际检查结果一致？
1. 确保 VSCode 中的 Stylelint 扩展已更新到最新版本
2. 检查 `.vscode/settings.json` 中的 `stylelint.validate` 配置，确保它只包含 CSS 相关文件类型
3. 运行 `npm run lint:css` 命令验证实际检查结果

### 如何在 JSX/TSX 文件中使用 CSS？
我们建议：
1. 使用单独的 CSS/SCSS 文件并导入
2. 或使用符合项目规范的 CSS-in-JS 解决方案，其样式质量将通过其他工具链保证

---

# Stylelint Configuration Guide

## 1. Configuration Overview

This project uses Stylelint for code quality checking of CSS files, but **does not check embedded CSS in JSX/TSX files**. This decision is based on the following considerations:

- Embedded CSS in JSX/TSX files (such as styled-components) requires specialized processor support, and current processor configurations may lead to inconsistent checking results
- To avoid errors like "Unknown word" or "CssSyntaxError", we have limited Stylelint's checking scope to pure CSS-related files
- ESLint is already responsible for checking code quality in TSX/JSX files

## 2. Checking Scope

The current Stylelint configuration only checks the following file types:
- `.css`
- `.scss`
- `.sass`
- `.less`
- `.styl`

**Not checking**:
- `.tsx`
- `.jsx`

## 3. Command Line Usage

### Check CSS files
```bash
npm run lint:css
```

### Automatically fix issues in CSS files
```bash
npm run lint:css:fix
```

### Check all files (including ESLint and Stylelint)
```bash
npm run lint
```

### Automatically fix issues in all files
```bash
npm run lint:fix
```

## 4. VSCode Configuration

### Install Extensions
Ensure you have installed the following VSCode extension:
- [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)

### Auto-fix Configuration
In `.vscode/settings.json`, we have configured auto-fix on save:

```json
"editor.codeActionsOnSave": {
  "source.fixAll.stylelint": "explicit"
}
```

### Validate File Types
The Stylelint plugin is configured to validate the following file types:

```json
"stylelint.validate": [
  "css",
  "scss",
  "sass",
  "less",
  "stylus"
]
```

## 5. Vite Integration

The project's Vite configuration has integrated the Stylelint plugin, which automatically checks CSS files during development. Configuration details:

- Checking scope: CSS-related files only
- Check on start: Enabled
- Auto-fix on save: Enabled

## 6. FAQ

### Why isn't the CSS in my JSX/TSX files being checked?
Stylelint currently does not check embedded CSS in JSX/TSX files to avoid syntax errors and configuration inconsistency issues.

### How to ensure plugin display results are consistent with actual check results?
1. Ensure the Stylelint extension in VSCode is updated to the latest version
2. Check the `stylelint.validate` configuration in `.vscode/settings.json` to ensure it only includes CSS-related file types
3. Run the `npm run lint:css` command to verify the actual check results

### How to use CSS in JSX/TSX files?
We recommend:
1. Using separate CSS/SCSS files and importing them
2. Or using CSS-in-JS solutions that comply with project specifications, whose style quality will be guaranteed through other toolchains