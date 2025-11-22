# CSS 代码质量检查

## 1. 概述

本项目使用 [Stylelint](https://stylelint.io/) 作为CSS代码质量检查工具，以确保样式代码的可维护性、一致性和性能。Stylelint 可以检测CSS语法错误、不兼容的浏览器属性、冗余代码、样式冲突以及不符合项目规范的命名约定等问题。

## 2. 安装与配置

### 2.1 已安装的依赖

项目中已集成以下 Stylelint 相关依赖：

- `stylelint`：核心检查工具
- `stylelint-config-standard`：标准规则配置
- `stylelint-config-recommended`：推荐规则配置
- `stylelint-config-css-modules`：CSS Modules 支持
- `stylelint-config-tailwindcss`：Tailwind CSS 支持
- `stylelint-order`：属性排序规则
- `vite-plugin-stylelint`：Vite 集成插件

### 2.2 配置文件

- `.stylelintrc.cjs`：主要配置文件，定义了检查规则
- `.stylelintignore`：指定不需要检查的文件和目录
- `.vscode/settings.json`：VSCode 编辑器集成配置

## 3. 使用方法

### 3.1 命令行使用

项目中已配置以下 npm 脚本：

```bash
# 运行所有代码检查（包括ESLint和Stylelint）
npm run lint

# 运行所有代码检查并自动修复问题
npm run lint:fix

# 仅运行CSS检查
npm run lint:css

# 仅运行CSS检查并自动修复问题
npm run lint:css:fix
```

### 3.2 开发过程中使用

1. **实时检查**：在使用 Vite 开发服务器时 (`npm run dev`)，Stylelint 会自动检查修改的 CSS 文件
2. **保存时自动修复**：在 VSCode 中保存文件时，Stylelint 会自动修复可修复的问题

### 3.3 编辑器集成

#### VSCode 集成

1. 安装 VSCode 插件：`stylelint.vscode-stylelint`
2. 项目已配置 `.vscode/settings.json`，无需额外配置
3. 开启后，VSCode 会在编辑器中直接显示 Stylelint 警告和错误，并支持自动修复

## 4. 规则说明

项目使用的主要规则包括：

- **语法错误检查**：检测 CSS 语法错误
- **代码风格**：确保缩进、空格、分号等符合规范
- **浏览器兼容性**：警告使用非标准或兼容性差的 CSS 属性
- **命名规范**：建议使用 BEM 或类似的命名约定
- **属性顺序**：按功能对 CSS 属性进行排序
- **Tailwind CSS 支持**：避免与 Tailwind CSS 冲突的规则

## 5. 自定义规则

如需自定义规则，可以编辑 `.stylelintrc.cjs` 文件。主要配置项包括：

- `rules`：自定义规则列表
- `extends`：继承的规则集
- `plugins`：使用的插件

## 6. 常见问题

### 6.1 忽略特定文件或代码块

- **忽略整个文件**：在文件顶部添加注释 `/* stylelint-disable */`
- **忽略特定规则**：在文件顶部添加注释 `/* stylelint-disable rule-name */`
- **忽略代码块**：使用 `/* stylelint-disable */` 和 `/* stylelint-enable */` 包裹代码块
- **在配置中忽略**：编辑 `.stylelintignore` 文件添加忽略模式

### 6.2 解决误报

如果遇到误报，可以：
1. 在相关代码行后添加 `/* stylelint-disable-next-line */`
2. 或者在 `.stylelintrc.cjs` 中修改相应规则配置

---

# CSS Code Quality Checking

## 1. Overview

This project uses [Stylelint](https://stylelint.io/) as a CSS code quality checking tool to ensure maintainability, consistency, and performance of style code. Stylelint can detect CSS syntax errors, incompatible browser properties, redundant code, style conflicts, and naming conventions that do not comply with project specifications.

## 2. Installation and Configuration

### 2.1 Installed Dependencies

The project has integrated the following Stylelint-related dependencies:

- `stylelint`: Core checking tool
- `stylelint-config-standard`: Standard rule configuration
- `stylelint-config-recommended`: Recommended rule configuration
- `stylelint-config-css-modules`: CSS Modules support
- `stylelint-config-tailwindcss`: Tailwind CSS support
- `stylelint-order`: Property ordering rules
- `vite-plugin-stylelint`: Vite integration plugin

### 2.2 Configuration Files

- `.stylelintrc.cjs`: Main configuration file defining checking rules
- `.stylelintignore`: Specifies files and directories not to be checked
- `.vscode/settings.json`: VSCode editor integration configuration

## 3. Usage

### 3.1 Command Line Usage

The following npm scripts have been configured in the project:

```bash
# Run all code checks (including ESLint and Stylelint)
npm run lint

# Run all code checks and automatically fix issues
npm run lint:fix

# Run CSS checks only
npm run lint:css

# Run CSS checks only and automatically fix issues
npm run lint:css:fix
```

### 3.2 Usage During Development

1. **Real-time Checking**: When using the Vite development server (`npm run dev`), Stylelint automatically checks modified CSS files
2. **Auto-fix on Save**: When saving files in VSCode, Stylelint automatically fixes fixable issues

### 3.3 Editor Integration

#### VSCode Integration

1. Install the VSCode plugin: `stylelint.vscode-stylelint`
2. The project has configured `.vscode/settings.json`, no additional configuration is needed
3. Once enabled, VSCode will display Stylelint warnings and errors directly in the editor and support auto-fixing

## 4. Rule Explanation

The main rules used by the project include:

- **Syntax Error Checking**: Detect CSS syntax errors
- **Code Style**: Ensure indentation, spaces, semicolons, etc. comply with standards
- **Browser Compatibility**: Warn about using non-standard or poorly compatible CSS properties
- **Naming Conventions**: Recommend using BEM or similar naming conventions
- **Property Ordering**: Sort CSS properties by function
- **Tailwind CSS Support**: Avoid rules that conflict with Tailwind CSS

## 5. Custom Rules

To customize rules, you can edit the `.stylelintrc.cjs` file. The main configuration items include:

- `rules`: List of custom rules
- `extends`: Inherited rule sets
- `plugins`: Plugins used

## 6. Common Issues

### 6.1 Ignoring Specific Files or Code Blocks

- **Ignore Entire File**: Add the comment `/* stylelint-disable */` at the top of the file
- **Ignore Specific Rules**: Add the comment `/* stylelint-disable rule-name */` at the top of the file
- **Ignore Code Blocks**: Wrap code blocks with `/* stylelint-disable */` and `/* stylelint-enable */`
- **Ignore in Configuration**: Edit the `.stylelintignore` file to add ignore patterns

### 6.2 Resolving False Positives

If you encounter false positives, you can:
1. Add `/* stylelint-disable-next-line */` after the relevant code line
2. Or modify the corresponding rule configuration in `.stylelintrc.cjs`