# GSatTrack 开发计划

## 项目概述
GSatTrack是一个卫星跟踪系统，提供3D和2D视图展示卫星轨道、位置信息和实时跟踪功能。本开发计划旨在完善系统核心功能，提升用户体验。

## 开发任务清单

### 1. TLE数据SQLite存储系统
**优先级：最高（基础设施）**
**模块：** 数据持久化系统
**当前问题：** TLE数据存储机制需要优化，支持高效查询和更新

#### 1.1 任务拆解
- **新增：** `src/database/schema/satellite_data.sql` - 卫星数据表结构
  ```sql
  CREATE TABLE satellite_tle_data (
    norad_id TEXT PRIMARY KEY,
    tle_line1 TEXT NOT NULL,
    tle_line2 TEXT NOT NULL,
    satellite_name TEXT,
    epoch_timestamp TIMESTAMP NOT NULL,
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_source TEXT,
    checksum TEXT,
    is_active BOOLEAN DEFAULT true
  );

  CREATE INDEX idx_satellite_epoch ON satellite_tle_data(epoch_timestamp);
  CREATE INDEX idx_satellite_active ON satellite_tle_data(is_active);
  ```

- **新增：** `src/services/SatelliteDatabaseService.ts` - 数据库服务（支持SQLite/HTTP API双模式）
  - 实现`initializeDatabase(): Promise<void>`
  - 实现`insertSatelliteTLE(noradId: string, tleLine1: string, tleLine2: string, name?: string): Promise<void>`
  - 实现`updateSatelliteTLE(noradId: string, tleLine1: string, tleLine2: string): Promise<void>`
  - 实现`getSatelliteTLE(noradId: string): Promise<TLEData | null>`
  - 实现`getAllActiveSatellites(): Promise<TLEData[]>`
  - 实现`deleteSatelliteTLE(noradId: string): Promise<void>`
  - 实现`switchDataSource(type: 'sqlite' | 'http'): void` - 数据源切换
  - 实现`getDataSourceType(): 'sqlite' | 'http'` - 获取当前数据源类型

- **修改：** `src/services/satelliteService.ts` - 集成数据库操作
  - 替换内存存储为SQLite数据库
  - 实现数据同步机制
  - 添加数据验证和错误处理

#### 1.2 技术要求
- 使用SQLite作为本地数据库（支持未来通过HTTP API接口替代）
- 实现数据完整性验证（TLE格式、校验和）
- 支持事务操作，确保数据一致性
- 实现数据备份和恢复机制
- 数据库服务层设计为可插拔架构，支持未来替换为HTTP API数据源
- 所有数据库操作通过抽象接口暴露，便于后续迁移到服务端API

#### 1.3 成功标准
- ✅ TLE数据持久化存储，应用重启后数据不丢失
- ✅ 支持高效的卫星数据查询和更新
- ✅ 数据库操作响应时间 < 100ms
- ✅ 提供数据导入/导出功能
- ✅ 数据源切换功能正常工作，支持SQLite和HTTP API模式
- ✅ 数据库服务接口设计通用化，便于未来迁移到服务端API

---

### 2. 文件上传逻辑重构
**优先级：高**
**模块：** TLE文件上传系统
**当前问题：** 文件上传逻辑未正确处理NoradID作为唯一标识符，无法区分更新与添加操作

#### 2.1 任务拆解
- **新增：** `src/utils/noradIdUtils.ts` - NoradID提取与验证工具函数
  - 实现`extractNoradIdFromTLE(tleLine1: string): string | null`
  - 实现`validateNoradId(noradId: string): boolean`
  - 实现`compareNoradIds(id1: string, id2: string): boolean`

- **修改：** `src/services/satelliteService.ts` - 添加上传逻辑判断
  - 在`processTLEFile()`方法中添加NoradID提取逻辑
  - 实现`determineUploadIntent(tleData: TLEData[]): 'add' | 'update' | 'mixed'`
  - 修改数据库操作逻辑，基于NoradID判断更新或添加

- **新增：** `src/utils/tleTimeUtils.ts` - TLE时间戳处理
  - 实现`extractTLEEpoch(tleLine1: string): Date`
  - 实现`compareTLETimeStamps(tle1: string, tle2: string): number`

#### 2.2 技术要求
- NoradID必须为5位数字格式
- TLE时间戳必须遵循标准格式：YYDDD.DDDDDDDD
- 更新判断标准：相同NoradID + 较新时间戳
- 批量上传时需支持混合操作（部分更新、部分添加）

#### 2.3 成功标准
- ✅ 上传相同NoradID的TLE数据时，系统自动识别为更新操作
- ✅ 上传新NoradID的TLE数据时，系统自动识别为添加操作
- ✅ 批量上传时正确处理每个卫星的更新/添加状态
- ✅ 提供清晰的上传结果反馈（成功/失败/更新数量统计）

---

### 3. QIANFAN卫星命名映射系统
**优先级：高**
**模块：** 卫星名称显示系统
**当前问题：** QIANFAN型号卫星在客户端有独立的命名体系，与TLE第一行名称不一致

#### 3.1 任务拆解
- **新增：** `src/services/NamingMappingService.ts` - 命名映射服务（支持SQLite/HTTP API双模式）
  - 实现`createMappingTable()` - 创建SQLite映射表
  - 实现`getSatelliteDisplayName(noradId: string, tleName: string): string`
  - 实现`updateMapping(noradId: string, displayName: string): Promise<void>`
  - 实现`batchUpdateMappings(mappings: Array<{noradId: string, displayName: string}>): Promise<void>`
  - 实现`switchDataSource(type: 'sqlite' | 'http'): void` - 数据源切换
  - 实现`getDataSourceType(): 'sqlite' | 'http'` - 获取当前数据源类型

- **新增：** `src/database/schema/namingMapping.sql` - 数据库表结构
  ```sql
  CREATE TABLE satellite_naming_mapping (
    norad_id TEXT PRIMARY KEY,
    tle_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    satellite_type TEXT DEFAULT 'QIANFAN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- **修改：** `src/components/SatelliteDetail.tsx` - 显示名称适配
  - 修改卫星名称显示逻辑，优先使用映射名称
  - 添加名称来源标识（TLE名称/映射名称）

- **修改：** `src/hooks/useSatelliteManager.ts` - 集成命名映射
  - 在卫星数据加载时同步获取显示名称
  - 实现名称缓存机制，避免重复查询

#### 3.2 技术要求
- NoradID作为主键，确保唯一性
- 支持批量更新映射关系
- 实现名称缓存，减少数据库查询次数
- 提供映射关系的导入/导出功能
- 命名映射服务设计为数据源无关，支持SQLite或HTTP API
- 实现抽象接口层，便于未来迁移到服务端API
- 缓存机制支持本地存储和远程存储两种模式

#### 3.3 成功标准
- ✅ QIANFAN卫星显示客户端特定名称而非TLE原始名称
- ✅ 映射关系持久化存储，重启后保持不变
- ✅ 支持动态更新映射关系，无需重启应用
- ✅ 提供映射关系管理界面（查看/编辑/批量导入）
- ✅ 数据源切换功能正常工作，支持SQLite和HTTP API模式
- ✅ 命名映射服务接口设计通用化，便于未来迁移到服务端API

---


**优先级：高**
**模块：** TLE文件上传系统
**当前问题：** 文件上传逻辑未正确处理NoradID作为唯一标识符，无法区分更新与添加操作

#### 2.1 任务拆解
- **新增：** `src/utils/noradIdUtils.ts` - NoradID提取与验证工具函数
  - 实现`extractNoradIdFromTLE(tleLine1: string): string | null`
  - 实现`validateNoradId(noradId: string): boolean`
  - 实现`compareNoradIds(id1: string, id2: string): boolean`

- **修改：** `src/services/satelliteService.ts` - 添加上传逻辑判断
  - 在`processTLEFile()`方法中添加NoradID提取逻辑
  - 实现`determineUploadIntent(tleData: TLEData[]): 'add' | 'update' | 'mixed'`
  - 修改数据库操作逻辑，基于NoradID判断更新或添加

- **新增：** `src/utils/tleTimeUtils.ts` - TLE时间戳处理
  - 实现`extractTLEEpoch(tleLine1: string): Date`
  - 实现`compareTLETimeStamps(tle1: string, tle2: string): number`



---


**优先级：高**
**模块：** 卫星名称显示系统
**当前问题：** QIANFAN型号卫星在客户端有独立的命名体系，与TLE第一行名称不一致

#### 3.1 任务拆解
- **新增：** `src/services/NamingMappingService.ts` - 命名映射服务
  - 实现`createMappingTable()` - 创建SQLite映射表
  - 实现`getSatelliteDisplayName(noradId: string, tleName: string): string`
  - 实现`updateMapping(noradId: string, displayName: string): Promise<void>`
  - 实现`batchUpdateMappings(mappings: Array<{noradId: string, displayName: string}>): Promise<void>`

- **新增：** `src/database/schema/namingMapping.sql` - 数据库表结构
  ```sql
  CREATE TABLE satellite_naming_mapping (
    norad_id TEXT PRIMARY KEY,
    tle_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    satellite_type TEXT DEFAULT 'QIANFAN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- **修改：** `src/components/SatelliteDetail.tsx` - 显示名称适配
  - 修改卫星名称显示逻辑，优先使用映射名称
  - 添加名称来源标识（TLE名称/映射名称）

- **修改：** `src/hooks/useSatelliteManager.ts` - 集成命名映射
  - 在卫星数据加载时同步获取显示名称
  - 实现名称缓存机制，避免重复查询

---



#### 3.2 技术要求
- NoradID作为主键，确保唯一性
- 支持批量更新映射关系
- 实现名称缓存，减少数据库查询次数
- 提供映射关系的导入/导出功能

#### 3.3 成功标准
- ✅ QIANFAN卫星显示客户端特定名称而非TLE原始名称
- ✅ 映射关系持久化存储，重启后保持不变
- ✅ 支持动态更新映射关系，无需重启应用
- ✅ 提供映射关系管理界面（查看/编辑/批量导入）

---



---

### 6. 设置界面卫星选择BUG修复
**优先级：中**
**模块：** 设置面板
**当前问题：** 初始状态下应选中全部卫星，但实际显示全不选

#### 4.1 任务拆解
- **修改：** `src/components/SettingsPanel.tsx` - 修复选择逻辑
  - 分析`useEffect`依赖数组，确保初始化时正确设置选中状态
  - 修改`handleSelectAll`和`handleDeselectAll`函数逻辑
  - 实现`initializeDefaultSelection()`方法

- **修改：** `src/hooks/useSatelliteManager.ts` - 优化状态管理
  - 修复`selectedSatellites`初始状态设置
  - 确保卫星列表加载完成后自动全选
  - 添加状态同步验证机制

#### 4.2 技术要求
- 默认选中状态必须在卫星列表加载完成后设置
- 避免重复渲染，优化性能
- 提供用户明确的选中状态反馈

#### 4.3 成功标准
- ✅ 应用启动时自动选中所有可用卫星
- ✅ 用户手动修改选择后，状态正确保持
- ✅ 新增卫星时自动加入选中列表
- ✅ 全选/全不选功能正常工作

---

### 7. 3D地球贴图手动旋转功能
**优先级：中**
**模块：** 3D视图交互
**当前问题：** 3D地球缺乏手动旋转控制，需要增加调试功能

#### 5.1 任务拆解
- **新增：** `src/components/EarthRotationControl.tsx` - 旋转控制组件
  - 实现旋转控制面板UI
  - 实现`setRotationX(angle: number): void`
  - 实现`setRotationY(angle: number): void`
  - 实现`setRotationZ(angle: number): void`
  - 实现`resetRotation(): void`

- **修改：** `src/components/Earth3D.tsx` - 集成旋转控制
  - 添加旋转状态管理：`const [earthRotation, setEarthRotation] = useState({ x: 0, y: 0, z: 0 })`
  - 修改Three.js地球模型，应用旋转变换
  - 实现旋转角度限制（-180°到+180°）

- **新增：** `src/utils/rotationUtils.ts` - 旋转计算工具
  - 实现`clampAngle(angle: number): number`
  - 实现`sphericalToCartesian(lat: number, lon: number, radius: number): Vector3`
  - 实现`calculateRotationMatrix(rotX: number, rotY: number, rotZ: number): Matrix4`

#### 5.2 技术要求
- 旋转控制精度：0.1度
- 支持键盘快捷键控制（方向键）
- 实现平滑旋转动画
- 提供预设视角（正视图、侧视图、俯视图）

#### 5.3 成功标准
- ✅ 提供直观的旋转控制界面
- ✅ 3D地球实时响应旋转操作
- ✅ 旋转角度精确到0.1度
- ✅ 支持键盘和鼠标控制

---

### 5. 3D地球时间光照效果
**优先级：高**
**模块：** 3D渲染系统
**当前问题：** 需要根据时间动态调整3D地球的光照效果

#### 6.1 任务拆解
- **修改：** `src/components/DynamicLighting.tsx` - 时间光照系统
  - 实现`calculateSunPosition(date: Date): { declination: number, hourAngle: number }`
  - 实现`updateLighting(date: Date): void`
  - 集成真实天文算法计算太阳位置

- **新增：** `src/utils/astronomicalCalculations.ts` - 天文计算工具
  - 实现`getJulianDay(date: Date): number`
  - 实现`calculateSolarDeclination(julianDay: number): number`
  - 实现`calculateEquationOfTime(julianDay: number): number`
  - 实现`calculateSunRightAscension(declination: number, julianDay: number): number`

- **修改：** `src/components/Earth3D.tsx` - 集成时间光照
  - 添加光照状态管理
  - 实现光照更新循环
  - 优化渲染性能

#### 6.2 技术要求
- 使用VSOP87行星理论算法
- 光照计算精度：±0.01度
- 支持时间范围：1900-2100年
- 性能要求：计算时间 < 1ms

#### 6.3 成功标准
- ✅ 地球光照随时间实时变化
- ✅ 昼夜分界线位置准确
- ✅ 极地昼夜现象正确显示
- ✅ 性能满足60FPS要求

---

### 4. 2D视图晨昏线效果
**优先级：高**
**模块：** 2D地图渲染
**当前问题：** 需要在2D地图上绘制准确的晨昏线

#### 7.1 任务拆解
- **新增：** `src/utils/terminatorCalculations.ts` - 晨昏线计算
  - 实现`calculateTerminatorPath(date: Date, resolution: number): Array<{lat: number, lon: number}>`
  - 实现`projectTerminatorToMap(terminatorPoints: Array<{lat: number, lon: number}>, projection: string): Array<{x: number, y: number}>`
  - 实现`getTerminatorEquation(solarDeclination: number, hourAngle: number): string`

- **修改：** `src/components/Map2D.tsx` - 晨昏线渲染
  - 添加晨昏线绘制层
  - 实现Canvas 2D渲染逻辑
  - 优化线条平滑度

- **新增：** `src/components/TerminatorOverlay.tsx` - 晨昏线覆盖层
  - 实现晨昏线可视化组件
  - 提供样式自定义选项
  - 支持动画效果

#### 7.2 技术要求
- 晨昏线精度：±1公里
- 支持多种地图投影（墨卡托、等经纬度等）
- 实现抗锯齿渲染
- 性能要求：绘制时间 < 16ms

#### 7.3 成功标准
- ✅ 晨昏线在2D地图上准确显示
- ✅ 线条平滑，无明显锯齿
- ✅ 支持实时更新
- ✅ 提供样式自定义选项

---

## 开发优先级与时间规划

### 第一阶段（基础设施）- 预计1周
1. TLE数据SQLite存储系统（基础设施，优先完成）

### 第二阶段（核心功能）- 预计1.5周
2. 文件上传逻辑重构
3. QIANFAN卫星命名映射系统
4. 3D地球时间光照效果
5. 2D视图晨昏线效果

### 第三阶段（优化完善）- 预计0.5周
6. 设置界面卫星选择BUG修复
7. 3D地球贴图手动旋转功能

## 技术栈与工具

### 核心技术
- **前端框架：** React 18 + TypeScript
- **3D渲染：** Three.js
- **2D地图：** Leaflet/Canvas API
- **数据库：** SQLite + SQL.js
- **构建工具：** Vite
- **状态管理：** React Hooks

### 算法库
- **天文计算：** 自定义实现VSOP87算法
- **坐标转换：** 自定义地理计算函数
- **时间处理：** 内置Date API + 自定义 Julian Day 计算

### 开发规范
- 代码风格：ESLint + Prettier
- 类型检查：TypeScript严格模式
- 测试覆盖：Jest + React Testing Library
- 文档标准：JSDoc + Markdown

## 验收标准

### 功能验收
- 所有任务完成度100%
- 通过单元测试和集成测试
- 性能指标达到要求
- 用户体验流畅，无明显卡顿

### 代码质量
- TypeScript类型安全，无any类型
- 代码覆盖率 > 80%
- 无ESLint警告和错误
- 文档完整，注释清晰

### 部署标准
- 构建成功，无错误
- 支持现代浏览器（Chrome, Firefox, Safari, Edge）
- 响应式设计，支持移动端
- 提供离线使用能力