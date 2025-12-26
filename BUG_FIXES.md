# Bug修复记录

## 概述
本文档记录了GSatTrack项目中发现并修复的所有bug，包括问题描述、原因分析和解决方案。

## 已修复的Bug

### 1. TLEFileUpload.tsx - 接口定义语法错误

**问题描述**: 构建失败，出现"Unexpected ':'"语法错误。

**原因分析**: TLEFileUploadProps接口定义中，disabled属性被错误地放置在接口外部，导致语法错误。

**解决方案**: 将disabled属性正确放置在TLEFileUploadProps接口内部，并修正缩进。

```typescript
// 修复前
interface TLEFileUploadProps {
  onFileUpload: (data: TLEData[]) => void;
  onClose?: () => void;
}
  disabled?: boolean;

// 修复后
interface TLEFileUploadProps {
  onFileUpload: (data: TLEData[]) => void;
  onClose?: () => void;
  disabled?: boolean;
}
```

### 2. App.tsx - 图标导入错误

**问题描述**: 构建失败，提示"FileImport"未在lucide-react库中导出。

**原因分析**: 代码尝试导入lucide-react库中不存在的"FileImport"图标组件。

**解决方案**: 将不存在的"FileImport"图标替换为lucide-react库中可用的"Upload"图标。

```typescript
// 修复前
import { FileImport, X } from 'lucide-react';

// 修复后
import { Upload, X } from 'lucide-react';
```

### 3. TLEFileUpload.tsx - 未使用的函数和冗余代码

**问题描述**: 组件中存在未使用的函数，增加了代码复杂性。

**原因分析**: `handleClearFile`和`validateFileType`函数定义但从未调用，`handleDragEnter`和`handleDragOver`功能重复。

**解决方案**: 移除未使用的函数，将功能重复的拖放事件处理函数合并，并优化代码结构。

### 4. TLEFileUpload.tsx - 变量名不一致

**问题描述**: 状态变量和setter函数命名不一致，容易导致混淆和错误。

**原因分析**: 状态定义为`[error, setError]`，但在某些地方使用`setUploadError`，导致不一致性。

**解决方案**: 统一变量名，将状态改为`[uploadError, setUploadError]`，并更新所有相关引用。

### 5. tleValidator.ts - 边界情况处理不足

**问题描述**: TLE内容验证器未正确处理空行和边界情况，可能导致错误报告不准确。

**原因分析**: 
- 未过滤空行后检查有效行数
- 行长度限制过于严格(69字符)
- 校验和错误被直接视为致命错误
- 缺少详细的错误信息收集

**解决方案**:
- 过滤空行后检查有效行数是否为3的倍数
- 计算原始文件实际行号用于错误报告
- 放宽行长度限制为68-70字符
- 将校验和错误改为警告而非错误，允许继续验证
- 添加详细错误信息数组，收集所有验证问题

### 6. tleParser.ts - 数值解析缺少NaN检查

**问题描述**: 解析TLE数据时没有检查parseFloat和parseInt结果是否为NaN，可能导致无效数据。

**原因分析**: 代码假设所有数值解析总是成功的，没有处理无效数字的情况。

**解决方案**:
- 提取轨道参数并添加NaN检查
- 确保关键数值有效后再进行计算
- 添加必要的错误处理逻辑

### 7. tleParser.ts - 卫星类型判断逻辑重叠

**问题描述**: 卫星类型判断逻辑优先级可能导致重叠，无法正确识别某些卫星类型。

**原因分析**: 判断条件没有明确的优先级顺序，不同类型的判断可能产生冲突。

**解决方案**:
- 按优先级顺序重新组织判断逻辑
- 最高优先级: 空间站(包括ISS、天宫等)
- 中间优先级: 特定类型卫星(如千帆、Starlink)
- 确保名称不为空后再进行判断

### 8. errorHandler.ts - 函数访问权限问题

**问题描述**: `getErrorSeverity`函数定义但未导出，其他模块无法访问。

**原因分析**: 缺少export关键字，导致函数只能在模块内部使用。

**解决方案**: 添加export关键字，使函数可以被其他模块导入使用。

```typescript
// 修复前
const getErrorSeverity = (errorType: TLEImportErrorType): ErrorSeverity => {
  // ...函数体
};

// 修复后
export const getErrorSeverity = (errorType: TLEImportErrorType): ErrorSeverity => {
  // ...函数体
};
```

### 9. errorHandler.ts - 缺少通用错误处理包装函数

**问题描述**: 各组件中错误处理逻辑重复，缺少统一的错误处理机制。

**原因分析**: 没有提供通用的try/catch包装函数，导致错误处理代码冗余。

**解决方案**:
- 添加`handleError`函数用于包装同步操作
- 添加`handleAsyncError`函数用于包装异步操作
- 统一错误捕获和处理逻辑

### 10. errorHandler.ts - CSS类名不统一

**问题描述**: 错误状态对应的CSS类名前缀不一致，可能与组件样式不匹配。

**原因分析**: 类名使用"tle-import-error-"前缀，而项目可能使用不同的命名约定。

**解决方案**: 将错误类名统一改为"error-"前缀，与项目其他部分保持一致。

### 11. TLEFileUpload.tsx - 错误类型引用错误

**问题描述**: 代码中引用了不存在的错误类型。

**原因分析**: 使用了未在TLEImportErrorType枚举中定义的FILE_READ_ERROR和SATELLITE_DATA_EMPTY类型。

**解决方案**:
- 将FILE_READ_ERROR替换为UNKNOWN_ERROR
- 将SATELLITE_DATA_EMPTY替换为PARSING_ERROR
- 修正错误创建函数的参数

## 总结

通过本次修复，解决了以下几个方面的问题：

1. **语法和类型错误**: 修复了接口定义错误和图标导入问题，确保代码能够成功编译。

2. **错误处理改进**: 
   - 统一了错误状态管理变量名
   - 优化了错误处理流程
   - 添加了通用错误处理包装函数
   - 修复了错误类型引用

3. **工具函数健壮性提升**: 
   - 增强了TLE验证器的边界情况处理
   - 添加了数值解析的有效性检查
   - 优化了卫星类型判断逻辑
   - 收集详细错误信息而非简单失败

4. **代码质量优化**: 
   - 移除未使用的函数
   - 合并功能重复的代码
   - 统一命名约定
   - 修正CSS类名

5. **构建和编译**: 确保项目能够成功构建，修复了所有编译错误。

这些修复显著提高了代码的健壮性、可维护性和用户体验，减少了潜在的运行时错误和异常情况。

---

## 弧段预报功能重构 (2024-12)

### 功能概述

将弧段预报功能重构为两个独立显示区域，提升用户体验和信息可读性。

### 实现内容

#### 1. 中央上方横幅 - 正在入境卫星

**文件**: `src/components/arc/ArcForecastBanner.tsx`

- 只显示 ACTIVE 状态的弧段（正在入境中）
- 倒计时改为显示剩余时间（从结束时间计算）
- 使用绿色主题（emerald-400）+ 闪烁图标
- 支持单个弧段关闭

#### 2. 左上角面板 - 即将入境卫星

**文件**: `src/components/arc/ArcUpcomingPanel.tsx`（新建）

- 显示所有即将入境的弧段（UPCOMING + PRE_APPROACH 状态）
- 倒计时显示距离开始时间
- 使用琥珀色主题（amber-400）+ 静态图标
- 最多显示4条预报
- **支持折叠/展开功能**：默认折叠，点击图标展开，不使用时贴在左侧边缘

#### 3. 数据处理优化

**文件**: `src/hooks/useArcMonitor.ts`

- `upcomingArcs` 包含所有未开始的弧段（不限时间）
- `activeArcs` 只包含活跃弧段
- 保持向后兼容性，`displayArcs` 用于可视化连线

#### 4. 工具函数扩展

**文件**: `src/utils/arcTimeUtils.ts`

- 新增 `formatCountdownShort` - 格式化距离开始时间的倒计时
- 新增 `formatRemainingTimeShort` - 格式化剩余时间倒计时

### 视觉效果对比

| 特性 | 正在入境 (中央横幅) | 即将入境 (左上角) |
|------|---------------------|-------------------|
| 颜色 | 绿色 (emerald-400) | 琥珀色 (amber-400) |
| 图标动画 | 闪烁 (animate-pulse) | 静态 |
| 倒计时 | 剩余时间 (结束时间) | 入境时间 (开始时间) |
| 最大数量 | 不限制 | 4条 |
| 交互 | 单个关闭按钮 | 折叠/展开功能 |

### 修改文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/components/arc/ArcUpcomingPanel.tsx` | 新建 | 左上角即将入境面板 |
| `src/components/arc/ArcForecastBanner.tsx` | 修改 | 改为只显示 activeArcs |
| `src/hooks/useArcMonitor.ts` | 修改 | upcomingArcs 包含所有未开始弧段 |
| `src/utils/arcTimeUtils.ts` | 修改 | 新增时间格式化函数 |
| `src/pages/HomePage.tsx` | 修改 | 集成新组件 |

### 测试验证

- [x] 中央横幅只显示 ACTIVE 状态的弧段
- [x] 中央横幅倒计时显示剩余时间
- [x] 左上角面板显示所有即将入境的弧段
- [x] 左上角面板倒计时显示距离开始时间
- [x] 折叠/展开功能正常
- [x] 面板位置不遮盖 Header
- [x] 2D、3D、分屏视图下两个面板都正常显示
- [x] 构建成功通过