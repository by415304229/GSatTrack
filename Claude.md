# GSatTrack - Claude AI 开发助手指南

## 项目概述

GSatTrack 是一个现代化的全球卫星跟踪与可视化系统，由"格思航天长管系统"开发。该系统支持实时追踪卫星轨道、地面站通信、3D/2D地图展示、TLE（Two-Line Elements）数据管理等功能。

## 技术栈

### 核心技术
- **React 18.2.0** + **TypeScript** - 前端框架
- **Vite 6.2.0** - 构建工具和开发服务器
- **Three.js 0.160.0** + **React Three Fiber** - 3D渲染
- **satellite.js 5.0.0** - 卫星轨道计算库

### UI框架
- **Ant Design 6.0.0** - 主要UI组件库
- **Tailwind CSS 3.4.18** - 原子化CSS框架
- **Lucide React 0.303.0** - 图标库

### 开发工具
- **ESLint 9.39.1** + **Stylelint 16.26.0** - 代码质量检查
- **Husky 8.0.0** + **lint-staged 15.0.0** - Git hooks
- **Jest 30.2.0** - 单元测试
- **Playwright 1.57.0** - E2E测试

## 项目结构

### 关键目录
```
src/
├── components/        # React组件（每个文件不超过300行）
├── hooks/            # 自定义Hooks
├── services/         # 业务服务层
├── utils/           # 工具函数（纯函数）
├── pages/           # 页面组件
└── layout/          # 布局组件
```

### 核心组件说明

#### 视图渲染
- `Earth3D.tsx` - 3D地球渲染，使用Three.js实现地球纹理、光照、晨昏线效果
- `Map2D.tsx` - 2D地图视图，支持多种投影模式
- `PlaneMonitor.tsx` - 轨道平面监控组件

#### 功能组件
- `SatelliteDetail.tsx` - 卫星详情展示
- `SettingsPanel.tsx` - 设置面板（卫星筛选、轨道窗口等）
- `StationPanel.tsx` - 地面站管理
- `TimeControls.tsx` - 时间控制（播放/暂停/倍速）
- `TLEFileUpload.tsx` - TLE文件上传组件
- `ViewToggle.tsx` - 视图切换（3D/2D/分屏）

#### 布局组件
- `Header.tsx` - 顶部控制栏
- `MainContent.tsx` - 主内容区布局
- `MainLayout.tsx` - 整体布局

### 关键服务

#### 卫星管理
- `useSatelliteManager.ts` - 卫星数据管理Hook
- `satelliteService.ts` - 卫星计算服务
- `tleParser.ts` - TLE数据解析
- `tleValidator.ts` - TLE数据验证
- `tleTimeUtils.ts` - TLE时间工具
- `noradIdUtils.ts` - NORAD ID处理

#### 其他服务
- `useTimeSimulation.ts` - 时间模拟引擎
- `NamingMappingService.ts` - 卫星名称映射服务
- `errorHandler.ts` - 错误处理工具

## 开发规范

### 通用规则

#### 沟通（Communication）
- **永远使用简体中文进行思考和对话**

#### 文档（Documentation）
- 编写 .md 文档时，也要用中文
- 正式文档写到项目的 `docs/` 目录下
- 用于讨论和评审的计划、方案等文档，写到项目的 `discuss/` 目录下

#### 代码架构（Code Architecture）

##### 硬性指标
- 对于 JavaScript/TypeScript 文件，**每个代码文件不要超过 300 行**
- 每层文件夹中的文件，**尽可能不超过 8 个**。如有超过，需要规划为多层子文件夹

##### 代码质量原则
时刻关注优雅的架构设计，避免出现以下可能侵蚀我们代码质量的「坏味道」：

1. **僵化 (Rigidity)**: 系统难以变更，任何微小的改动都会引发一连串的连锁修改
2. **冗余 (Redundancy)**: 同样的代码逻辑在多处重复出现，导致维护困难且容易产生不一致
3. **循环依赖 (Circular Dependency)**: 两个或多个模块互相纠缠，形成无法解耦的"死结"
4. **脆弱性 (Fragility)**: 对代码一处的修改，导致了系统中其他看似无关部分功能的意外损坏
5. **晦涩性 (Obscurity)**: 代码意图不明，结构混乱，导致阅读者难以理解其功能和设计
6. **数据泥团 (Data Clump)**: 多个数据项总是一起出现在不同方法的参数中，暗示着它们应该被组合成一个独立的对象
7. **不必要的复杂性 (Needless Complexity)**: 过度设计使系统变得臃肿且难以理解

##### 执行要求
- 【非常重要！！】无论是自己编写代码，还是阅读或审核他人代码时，都要严格遵守上述硬性指标
- 【非常重要！！】无论何时，一旦你识别出那些可能侵蚀我们代码质量的「坏味道」，都应当立即询问用户是否需要优化，并给出合理的优化建议

### 代码组织规范

#### 组件设计原则
1. **单一职责**: 每个组件只负责一个功能
2. **组合优于继承**: 使用组件组合构建复杂功能
3. **状态管理**:
   - 使用自定义Hooks管理复杂状态逻辑
   - 避免过度使用Context，优先考虑组件状态提升
   - 全局状态使用React Context或外部状态管理

#### 文件命名规范
- 组件文件使用PascalCase: `SatelliteDetail.tsx`
- Hook文件以use开头: `useSatelliteManager.ts`
- 工具函数使用camelCase: `tleParser.ts`
- 服务文件以Service结尾: `satelliteService.ts`

#### TypeScript使用规范
- 为所有组件定义Props接口
- 导出必要的类型定义到`types.ts`
- 避免使用any类型，优先使用unknown或具体类型
- 使用泛型提高代码复用性

#### 样式规范
- 优先使用Tailwind CSS类
- 复杂样式使用CSS模块或styled-components
- 保持响应式设计，适配不同屏幕尺寸

#### 组件风格统一规范
- **【非常重要！！！】务必保持组件风格统一**
- 所有组件必须使用**统一的设计语言**和**交互模式**
- 相同功能的组件应使用相同的：
  - UI布局结构（按钮位置、标题层级、间距规范）
  - 颜色主题（主色调、辅助色、警告色、成功色等）
  - 交互反馈（hover效果、点击动画、加载状态）
  - 错误处理和提示方式
- 参考现有组件的设计模式，避免创造不一致的UI
- 新增组件时，优先复用Ant Design组件，保持整体视觉一致性
- 禁止出现"一个功能一种风格"的情况，确保用户体验的连贯性

### 开发工作流

#### 分支管理
- `main` - 生产环境分支
- `develop` - 开发分支
- `feature/*` - 功能分支
- `bugfix/*` - 修复分支

#### 提交规范
使用中文提交信息，格式：
```
<type>(<scope>): <description>

<body>

<footer>
```

类型说明：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建或工具相关

示例：
```
feat(3D渲染): 添加晨昏线效果

- 基于太阳位置计算晨昏线
- 使用Shader实现渐变效果
- 支持时间变化时的动态更新

Closes #123
```

#### 代码审查要点
1. 功能是否正确实现
2. 代码是否符合规范
3. 是否存在潜在的性能问题
4. 是否有充分的错误处理
5. 是否有必要的测试

## 特殊功能说明

### TLE数据处理
- 支持三行式TLE格式（名称行+两行轨道数据）
- 自动验证TLE数据有效性
- 支持批量导入和更新
- 内置Starlink、千帆星座等卫星数据

### 时间模拟系统
- 独立的时间流，不受系统时间影响
- 支持暂停、快进（1x/10x/100x/1000x）
- 可以回放历史数据或预测未来轨道

### 3D渲染优化
- 使用对象池减少GC压力
- 轨道线批量渲染
- Level of Detail (LOD) 优化远距离观察

### 地面站计算
- 计算卫星过境时间窗口
- 判断通信可见性
- 支持多地面站同时监控

## 常见问题处理

### 开发环境
1. **端口占用**: 开发服务器默认使用5173端口
2. **热更新失败**: 检查是否有语法错误或TypeScript类型错误
3. **3D渲染异常**: 确认浏览器支持WebGL

### 性能优化
1. **卫星数量过多**: 使用LOD和视锥剔除
2. **内存泄漏**: 及时清理Three.js对象和事件监听器
3. **计算量大**: 使用Web Worker处理轨道计算

### 调试技巧
1. 使用React DevTools查看组件状态
2. 使用Three.js Inspector查看3D场景
3. 在控制台查看卫星坐标和时间信息

## 部署说明

### 构建命令
```bash
npm run build          # 生产构建
npm run preview        # 预览构建结果
```

### 环境变量
- `VITE_APP_TITLE` - 应用标题
- `VITE_API_BASE_URL` - API基础URL

### 部署要求
- 服务器必须支持HTTPS（WebGL要求）
- 需要正确配置MIME类型
- 建议启用Gzip压缩

## 测试策略

### 单元测试
- 使用Jest进行组件和工具函数测试
- 覆盖率要求：核心模块 > 80%

### E2E测试
- 使用Playwright进行关键流程测试
- 测试用例包括：
  - TLE文件上传
  - 视图切换
  - 时间控制
  - 卫星筛选

### 性能测试
- 使用Lighthouse评估性能
- 监控以下指标：
  - 首屏加载时间 < 3s
  - 交互响应时间 < 100ms
  - 3D渲染帧率 > 30fps

## 联系方式

如有问题或建议，请通过以下方式联系：
- 项目仓库: https://github.com/your-username/GSatTrack
- 问题反馈: 在GitHub创建Issue

---

**最后更新**: 2025-12-17
**版本**: 1.0.0