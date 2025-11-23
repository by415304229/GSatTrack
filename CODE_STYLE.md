# 代码规范文档 (Code Style Guide)

## 目录 (Table of Contents)
- [TypeScript/JavaScript规范](#typescriptjavascript规范)
- [React规范](#react规范)
- [CSS/SCSS规范](#cssscss规范)
- [开发工作流程](#开发工作流程)
- [代码检查工具](#代码检查工具)

## TypeScript/JavaScript规范

### 编码风格
- 使用2个空格进行缩进
- 使用单引号定义字符串
- 使用驼峰命名法 (camelCase) 命名变量和函数
- 使用帕斯卡命名法 (PascalCase) 命名类和组件
- 始终使用分号结束语句
- 箭头函数用于匿名函数

### 最佳实践
- 严格使用TypeScript类型，避免`any`类型
- 使用`const`和`let`，避免使用`var`
- 使用空值合并运算符 (`??`) 和可选链 (`?.`)
- 函数参数和返回值必须有类型定义
- 优先使用接口(interface)定义对象类型
- 优先使用联合类型(`|`)而非枚举(enum)

### 命名规范
- 接口: `PascalCase` (例如: `UserProfile`)
- 类型: `PascalCase` (例如: `ResponseData`)
- 变量: `camelCase` (例如: `userName`)
- 常量: `UPPER_SNAKE_CASE` (例如: `API_URL`)
- 函数/方法: `camelCase` (例如: `fetchData`)
- 类: `PascalCase` (例如: `DataService`)

## React规范

### 组件结构
- 使用函数组件和Hooks
- 组件命名使用`PascalCase`
- 文件命名与组件名保持一致
- 使用`useState`, `useEffect`, `useContext`等React Hooks
- 自定义Hook命名以`use`开头

### JSX规范
- 组件属性使用`camelCase`
- 字符串属性值使用单引号
- 布尔值属性直接省略值
- 自闭合标签必须使用`/>`
- 多行JSX必须使用括号包裹

### Hooks使用规范
- 只在函数组件或自定义Hook中调用Hooks
- 遵循Hooks的依赖数组规则
- 避免在循环、条件或嵌套函数中调用Hooks

## CSS/SCSS规范

### 样式命名
- 使用BEM命名约定 (Block__Element--Modifier)
- 样式文件命名与组件文件保持一致
- 避免使用ID选择器
- 优先使用CSS变量管理主题和常量

### 样式编写
- 样式属性按字母顺序排列
- 使用flexbox和grid布局
- 避免使用!important
- 合理使用嵌套，但不超过3层

## 开发工作流程

### 代码提交规范
- 提交消息格式: `类型(范围): 简短描述`
  - 类型: feat, fix, docs, style, refactor, test, chore
  - 范围: 功能模块或组件名称

### 分支管理
- `main` - 稳定版本分支
- `develop` - 开发分支
- `feature/*` - 新功能分支
- `bugfix/*` - Bug修复分支

### 代码审查
- 提交Pull Request前运行所有检查
- 保持PR专注于单个任务或功能
- 编写清晰的PR描述

## 代码检查工具

### 工具配置
- 使用ESLint进行代码质量检查
- 使用Stylelint进行CSS/SCSS检查
- 使用TypeScript进行类型检查
- 使用Git Hooks在提交前运行检查

### ESLint规则配置
本项目采用宽松的ESLint配置，以下警告类型被禁用：
- **@typescript-eslint/no-explicit-any**: 允许使用`any`类型，提高开发效率
- **@typescript-eslint/explicit-function-return-type**: 不强制要求函数返回类型注解
- **@typescript-eslint/explicit-module-boundary-types**: 不强制要求模块边界类型
- **@typescript-eslint/naming-convention**: 不强制命名规范，允许灵活的命名方式

### 开发环境集成
- 配置VSCode自动格式化和修复
- 使用Vite插件在开发时实时检查

### 运行检查
- 运行所有检查: `npm run lint`
- 自动修复问题: `npm run lint:fix`
- 类型检查: `npm run type-check`

---

# 代码規範文檔 (Code Style Guide)

## 目錄 (Table of Contents)
- [TypeScript/JavaScript规范](#typescriptjavascript规范)
- [React规范](#react规范)
- [CSS/SCSS规范](#cssscss规范)
- [开发工作流程](#开发工作流程)
- [代码检查工具](#代码检查工具)

## TypeScript/JavaScript规范

### 編碼風格
- 使用2個空格進行縮進
- 使用單引號定義字符串
- 使用駝峰命名法 (camelCase) 命名變量和函數
- 使用帕斯卡命名法 (PascalCase) 命名類和組件
- 始終使用分號結束語句
- 箭頭函數用於匿名函數

### 最佳實踐
- 嚴格使用TypeScript類型，避免`any`類型
- 使用`const`和`let`，避免使用`var`
- 使用空值合併運算符 (`??`) 和可選鏈 (`?.`)
- 函數參數和返回值必須有類型定義
- 優先使用接口(interface)定義對象類型
- 優先使用聯合類型(`|`)而非枚舉(enum)

### 命名規範
- 接口: `PascalCase` (例如: `UserProfile`)
- 類型: `PascalCase` (例如: `ResponseData`)
- 變量: `camelCase` (例如: `userName`)
- 常量: `UPPER_SNAKE_CASE` (例如: `API_URL`)
- 函數/方法: `camelCase` (例如: `fetchData`)
- 類: `PascalCase` (例如: `DataService`)

## React规范

### 組件結構
- 使用函數組件和Hooks
- 組件命名使用`PascalCase`
- 文件命名與組件名保持一致
- 使用`useState`, `useEffect`, `useContext`等React Hooks
- 自定義Hook命名以`use`開頭

### JSX規範
- 組件屬性使用`camelCase`
- 字符串屬性值使用單引號
- 布爾值屬性直接省略值
- 自閉合標籤必須使用`/>`
- 多行JSX必須使用括號包裹

### Hooks使用規範
- 只在函數組件或自定義Hook中調用Hooks
- 遵循Hooks的依賴數組規則
- 避免在循環、條件或嵌套函數中調用Hooks

## CSS/SCSS规范

### 樣式命名
- 使用BEM命名約定 (Block__Element--Modifier)
- 樣式文件命名與組件文件保持一致
- 避免使用ID選擇器
- 優先使用CSS變量管理主題和常量

### 樣式編寫
- 樣式屬性按字母順序排列
- 使用flexbox和grid布局
- 避免使用!important
- 合理使用嵌套，但不超過3層

## 開發工作流程

### 代碼提交規範
- 提交消息格式: `類型(範圍): 簡短描述`
  - 類型: feat, fix, docs, style, refactor, test, chore
  - 範圍: 功能模塊或組件名稱

### 分支管理
- `main` - 穩定版本分支
- `develop` - 開發分支
- `feature/*` - 新功能分支
- `bugfix/*` - Bug修復分支

### 代碼審查
- 提交Pull Request前運行所有檢查
- 保持PR專注於單個任務或功能
- 編寫清晰的PR描述

## 代碼檢查工具

### 工具配置
- 使用ESLint進行代碼質量檢查
- 使用Stylelint進行CSS/SCSS檢查

### ESLint規則配置
本項目采用寬松的ESLint配置，以下警告類型被禁用：
- **@typescript-eslint/no-explicit-any**: 允許使用`any`類型，提高開發效率
- **@typescript-eslint/explicit-function-return-type**: 不強制要求函數返回類型注解
- **@typescript-eslint/explicit-module-boundary-types**: 不強制要求模塊邊界類型
- **@typescript-eslint/naming-convention**: 不強制命名規范，允許靈活的命名方式
- 使用TypeScript進行類型檢查
- 使用Git Hooks在提交前運行檢查

### 開發環境集成
- 配置VSCode自動格式化和修復
- 使用Vite插件在開發時實時檢查

### 運行檢查
- 運行所有檢查: `npm run lint`
- 自動修復問題: `npm run lint:fix`
- 類型檢查: `npm run type-check`