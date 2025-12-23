# GSatTrack 开发计划

## 一、项目概述
GSatTrack是一个卫星跟踪系统，提供3D和2D视图展示卫星轨道、位置信息和实时跟踪功能。本开发计划旨在完善系统核心功能，提升用户体验。

## 二、开发任务清单

### 1. 已完成功能

#### 1.1 TLE数据管理
- ✅ TLE文件导入功能，支持拖放上传和传统文件选择
- ✅ 文件类型验证，仅允许.tle或.txt格式文件
- ✅ TLE内容校验模块，确保符合TLE数据格式规范
- ✅ 数据解析模块，针对不同类型卫星数据进行结构化处理
- ✅ 错误提示系统，显示明确的错误指引
- ✅ 基于文件的卫星组数据更新机制
- ✅ 卫星数据增量更新逻辑，支持"覆盖"和"追加"两种模式

#### 1.2 卫星命名映射
- ✅ NamingMappingService.ts 实现
- ✅ 卫星名称映射功能

#### 1.3 视图交互
- ✅ 3D地球视图和2D地图视图
- ✅ 时间控制功能
- ✅ 视图切换功能
- ✅ 3D地球时间光照效果
- ✅ 2D视图晨昏线效果
- ✅ 夜间城市灯光效果

### 2. 新增功能规划

#### 2.1 弧段规划信息集成
**优先级：高**
**模块：** API集成、数据管理、实时通信
**预估工作量：** 15人天

##### 2.1.1 HTTP API集成
- 创建弧段规划数据模型和类型定义
- 实现HTTP请求服务模块（`src/services/arcService.ts`）
- 添加WebSocket实时数据接收功能
- 设计弧段数据验证和容错机制
- 集成到现有数据流架构

##### 2.1.2 弧段可视化实现
- 在3D/2D视图中实现卫星与地面站连线显示
- 使用InstancedMesh优化大量连线渲染性能
- 实现连线状态动画（激活/未激活）
- 支持连线样式自定义（颜色、粗细、透明度）

##### 2.1.3 弧段预报界面
- 创建弧段预报面板组件（`src/components/ArcForecastPanel.tsx`）
- 在醒目位置显示即将到来的弧段信息
- 实现弧段倒计时功能（`src/components/Countdown.tsx`）
- 支持弧段详情快速查看和操作

##### 2.1.4 语音播报系统
- 实现Web Speech API封装服务（`src/services/speechService.ts`）
- 支持中英文语音播报
- 实现入境前1分钟自动语音提醒
- 提供语音播报开关和音量控制

#### 2.2 地理要素增强
**优先级：高**
**模块：** 3D渲染、2D地图、地理数据
**预估工作量：** 10人天

##### 2.2.1 中国国境线图层
- 获取和处理中国国境线GeoJSON数据
- 在3D地球上实现国境线渲染（`Earth3D.tsx`）
- 在2D地图上实现国境线显示（`Map2D.tsx`）
- 支持国境线样式自定义（颜色、宽度、显示/隐藏）

##### 2.2.2 SAA区域显示
- 定义南大西洋地磁异常区边界数据
- 实现3D视图中SAA区域半透明覆盖层
- 在2D地图上绘制SAA区域多边形
- 添加卫星进入SAA区域的检测和提醒功能

#### 2.3 设置面板扩展
**优先级：中**
**模块：** UI组件、设置管理
**预估工作量：** 5人天

##### 2.3.1 图层控制功能
- 添加国境线显示开关
- 添加SAA区域显示开关
- 实现SAA区域样式自定义（颜色、透明度）
- 保存用户偏好设置到localStorage

##### 2.3.2 语音播报设置
- 语音播报总开关
- 播报语言选择（中文/英文）
- 提前提醒时间设置（1-5分钟）
- 音量控制

### 3. 技术优化任务

#### 3.1 性能优化
**优先级：中**
**预估工作量：** 8人天

##### 3.1.1 渲染性能优化
- 实现连线对象的LOD（细节层次）系统
- 优化大量地理要素的批处理渲染
- 实现视锥剔除，只渲染可见区域
- 添加帧率监控和性能分析工具

##### 3.1.2 内存管理优化
- 实现弧段数据的智能缓存机制
- 添加历史数据的自动清理策略
- 优化Three.js对象的生命周期管理

#### 3.2 代码质量提升
**优先级：中**
**预估工作量：** 5人天

- 添加新功能的单元测试
- 完善TypeScript类型定义
- 更新文档和代码注释
- 进行跨浏览器兼容性测试

### 4. 长期规划功能

#### 4.1 高级分析功能
**优先级：低**
**预估工作量：** 20人天

- 卫星可见性分析工具
- 弧段冲突检测和建议
- 通信质量评估模型
- 历史数据统计和报表生成

#### 4.2 扩展功能
**优先级：低**
**预估工作量：** 15人天

- 支持多个地面站同时监控
- 卫星碰撞预警系统
- 轨道机动规划工具
- 自定义区域标记和测量

## 三、技术实现细节

### 3.1 数据结构设计

#### 弧段数据模型
```typescript
export interface ArcSegment {
  id: string;
  satelliteId: string;
  groundStationId: string;
  startTime: Date;
  endTime: Date;
  aosTime: Date; // Acquisition of Signal
  losTime: Date; // Loss of Signal
  maxElevation: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export interface ArcPlan {
  id: string;
  name: string;
  segments: ArcSegment[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### 地理要素数据模型
```typescript
export interface GeographicBoundary {
  id: string;
  name: string;
  type: 'border' | 'zone' | 'area';
  coordinates: Array<{lat: number, lon: number}>;
  style?: {
    color: string;
    opacity: number;
    strokeWidth: number;
  };
}

export interface SAABoundary {
  id: string;
  name: string;
  coordinates: Array<{lat: number, lon: number}>;
  center: {lat: number, lon: number};
  radius: number;
}
```

### 3.2 HTTP API 集成方案

#### 3.2.1 技术选型
基于项目现有架构，采用以下技术方案：
- **HTTP 客户端**: 使用浏览器原生 `fetch` API（与现有代码保持一致）
- **数据缓存**: localStorage 作为主缓存层
- **状态管理**: 自定义 React Hooks
- **实时更新**: WebSocket + 轮询机制（可选）

#### 3.2.2 实现架构

```typescript
// src/services/arcService.ts
// API配置
const ARC_API_CONFIG = {
  development: 'http://localhost:3000/api',
  production: '/api'
};

// 主要获取函数 - 遵循现有 localStorage 优先模式
export const fetchArcPlans = async (): Promise<ArcPlan[]> => {
  // 1. 优先从 localStorage 读取
  const localArcPlans = localStorage.getItem('arcPlans');
  if (localArcPlans) {
    try {
      const plans = JSON.parse(localArcPlans);
      return validateAndTransformArcPlans(plans);
    } catch (error) {
      console.error('Failed to parse arc plans from localStorage:', error);
    }
  }

  // 2. localStorage 无数据时，从 API 获取
  try {
    const plans = await fetchArcPlansFromAPI();
    localStorage.setItem('arcPlans', JSON.stringify(plans));
    return plans;
  } catch (error) {
    console.error('Failed to fetch arc plans from API:', error);
    return [];
  }
};

// 数据验证和转换
const validateAndTransformArcPlans = (plans: any[]): ArcPlan[] => {
  return plans.map(plan => ({
    ...plan,
    createdAt: new Date(plan.createdAt),
    updatedAt: new Date(plan.updatedAt),
    segments: plan.segments.map((seg: any) => ({
      ...seg,
      startTime: new Date(seg.startTime),
      endTime: new Date(seg.endTime),
      aosTime: new Date(seg.aosTime),
      losTime: new Date(seg.losTime)
    }))
  }));
};
```

#### 3.2.3 React Hook 封装

```typescript
// src/hooks/useArcService.ts
export const useArcService = () => {
  const [arcPlans, setArcPlans] = useState<ArcPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载弧段数据
  const loadArcPlans = useCallback(async () => {
    setLoading(true);
    try {
      const plans = await fetchArcPlans();
      setArcPlans(plans);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 从 API 强制刷新
  const refreshFromAPI = useCallback(async () => {
    setLoading(true);
    try {
      const plans = await fetchArcPlansFromAPI();
      localStorage.setItem('arcPlans', JSON.stringify(plans));
      setArcPlans(plans);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { arcPlans, loading, error, loadArcPlans, refreshFromAPI };
};
```

#### 3.2.4 实时数据更新方案

```typescript
// src/services/arcPollingService.ts
export class ArcPollingService {
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Set<(plans: ArcPlan[]) => void> = new Set();
  private lastUpdate: Date | null = null;

  // 开始轮询（默认每分钟）
  start(intervalMs: number = 60000) {
    this.intervalId = setInterval(async () => {
      try {
        const plans = await fetchArcPlansFromAPI();
        const latestUpdate = this.getLatestUpdateTime(plans);

        if (!this.lastUpdate || latestUpdate > this.lastUpdate) {
          this.lastUpdate = latestUpdate;
          localStorage.setItem('arcPlans', JSON.stringify(plans));
          this.notify(plans);
        }
      } catch (error) {
        console.error('Polling failed:', error);
      }
    }, intervalMs);
  }

  // WebSocket 连接（用于高频率更新）
  connectWebSocket(url: string) {
    const ws = new WebSocket(url);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'arc:updated') {
        const plans = message.data;
        localStorage.setItem('arcPlans', JSON.stringify(plans));
        this.notify(plans);
      }
    };
    return ws;
  }
}
```

### 3.3 API接口设计

#### RESTful API端点
```
GET    /api/arc-plans          // 获取弧段规划列表
GET    /api/arc-plans/:id      // 获取特定弧段规划
POST   /api/arc-plans          // 创建新弧段规划
PUT    /api/arc-plans/:id      // 更新弧段规划
DELETE /api/arc-plans/:id      // 删除弧段规划
```

#### WebSocket事件
```
arc:updated     // 弧段数据更新
arc:activated   // 弧段激活
arc:completed   // 弧段完成
sat:position    // 卫星位置更新（高频）
```

### 3.3 组件架构

#### 新增组件列表
```
src/components/
├── ArcForecastPanel.tsx      // 弧段预报面板
│   ├── 使用 useArcService Hook
│   ├── 显示即将到来的弧段列表
│   ├── 集成 Countdown 组件
│   └── 支持弧段筛选和排序
├── ArcConnectionLine.tsx     // 卫星连线组件
│   ├── 3D 渲染：使用 THREE.Line
│   ├── 2D 渲染：Canvas 2D 绘制
│   ├── LOD 优化：远距离简化
│   └── 批量渲染：InstancedMesh
├── Countdown.tsx             // 倒计时组件
│   ├── 使用 requestAnimationFrame
│   ├── 支持格式化时间显示
│   └── 完成回调触发语音播报
├── GeographicBoundary.tsx    // 地理边界组件
│   ├── 加载 GeoJSON 数据
│   ├── 3D/2D 渲染适配
│   └── 样式配置支持
├── SAABoundary.tsx           // SAA区域组件
│   ├── 多边形填充渲染
│   ├── 边界高亮显示
│   └── 卫星进入检测
└── ArcDetailModal.tsx        // 弧段详情弹窗
    ├── 弧段信息展示
    ├── 操作按钮（编辑/删除）
    └── 相关卫星信息链接
```

#### 新增服务列表
```
src/services/
├── arcService.ts             // 弧段数据服务
│   ├── HTTP 请求封装
│   ├── localStorage 缓存管理
│   ├── 数据验证和转换
│   └── 与现有 satelliteService 对接
├── arcPollingService.ts      // 实时更新服务
│   ├── 定时轮询机制
│   ├── WebSocket 连接管理
│   ├── 自动重连逻辑
│   └── 更新通知分发
├── speechService.ts          // 语音播报服务
│   ├── Web Speech API 封装
│   ├── 语音队列管理
│   ├── 多语言支持
│   └── 音量控制接口
├── geoDataService.ts         // 地理数据服务
│   ├── GeoJSON 数据加载
│   ├── 坐标系转换
│   ├── 数据缓存管理
│   └── SAA 区域定义
└── notificationService.ts    // 通知服务
    ├── 弧段提醒管理
    ├── SAA 入境警告
    └── 用户偏好设置
```

#### 新增Hooks列表
```
src/hooks/
├── useArcService.ts          // 弧段数据管理
│   ├── 封装 arcService 调用
│   ├── 状态管理（loading/error）
│   ├── 自动刷新机制
│   └── 与 useSatelliteManager 集成
├── useArcSegments.ts         // 弧段计算逻辑
│   ├── 激活弧段筛选
│   ├── 时间窗口计算
│   ├── 与时间模拟系统集成
│   └── 连线状态判断
├── useSpeechSynthesis.ts     // 语音合成
│   ├── 语音播报控制
│   ├── 队列管理
│   ├── 权限检查
│   └── 设置同步
├── useGeographicData.ts      // 地理数据加载
│   ├── 数据懒加载
│   ├── 缓存管理
│   ├── 错误重试
│   └── 样式应用
├── useCountdown.ts           // 倒计时逻辑
│   ├── 高精度时间计算
│   ├── 暂停/恢复支持
│   ├── 格式化输出
│   └── 事件回调
└── useSettings.ts            // 新功能设置
    ├── localStorage 同步
    ├── 默认值管理
    ├── 设置验证
    └── 热更新支持
```

## 四、技术栈与工具

### 核心技术
- **前端框架：** React 18 + TypeScript
- **3D渲染：** Three.js + React Three Fiber
- **2D地图：** Canvas API
- **数据通信：** HTTP API (fetch) + WebSocket
- **数据缓存：** localStorage
- **语音合成：** Web Speech API
- **构建工具：** Vite
- **状态管理：** React Hooks + 自定义Hooks

### 新增技术选型说明

#### HTTP 客户端选择
选择原生 `fetch` API 的原因：
- ✅ 与现有代码风格保持一致
- ✅ 无需引入额外依赖
- ✅ 现代浏览器原生支持
- ✅ 满足项目需求（简单请求、缓存可控）

#### 不使用第三方库的原因
- **Axios/React Query**：增加包体积，现有需求简单
- **Redux/MobX**：现有 Hooks 方案已足够
- **SWR**：与自定义轮询服务重复

### 环境配置
```typescript
// vite.config.ts 需要的代理配置
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

### 算法库
- **天文计算：** satellite.js库 + 自定义太阳位置计算
- **坐标转换：** 自定义地理计算函数
- **时间处理：** 内置Date API + 自定义 Julian Day 计算
- **地理数据处理：** GeoJSON解析和渲染

### 开发规范
- 代码风格：ESLint + Prettier
- 类型检查：TypeScript严格模式
- 测试覆盖：Jest + React Testing Library + Playwright
- 文档标准：JSDoc + Markdown

## 五、开发计划时间表

### 第一阶段（4周）- 弧段规划核心功能
**第1-2周：**
- 完成弧段数据模型设计和API服务实现
- 实现基础的弧段数据接收和存储功能
- 创建ArcForecastPanel组件的基础框架

**第3-4周：**
- 完成卫星与地面站连线的3D/2D渲染
- 实现弧段倒计时和状态显示功能
- 集成语音播报系统

### 第二阶段（3周）- 地理要素增强
**第5-6周：**
- 实现中国国境线图层的加载和渲染
- 完成SAA区域的定义和可视化
- 在设置面板中添加图层控制功能

**第7周：**
- 优化渲染性能，添加缓存机制
- 完成单元测试和集成测试

### 第三阶段（2周）- 优化和完善
**第8周：**
- 性能优化和bug修复
- 用户体验改进和UI调整

**第9周：**
- 文档更新和代码审查
- 部署和发布准备

## 六、验收标准

### 功能验收
- 所有新增功能100%完成，通过需求验收
- API接口响应时间 < 500ms
- 3D渲染帧率 > 30fps（1000个连线对象）
- 语音播报准确率 > 99%

### 性能指标
- 页面加载时间 < 3秒
- 内存使用增长 < 100MB（正常使用24小时）
- CPU占用率 < 30%（空闲时）

### 代码质量
- TypeScript类型覆盖率 100%
- 单元测试覆盖率 > 85%
- 集成测试覆盖率 > 70%
- 无ESLint警告和错误

### 浏览器兼容性
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 部署标准
- 构建成功，无错误
- 支持现代浏览器（Chrome, Firefox, Safari, Edge）
- 响应式设计，支持移动端
- 提供离线使用能力

## 七、风险评估

### 技术风险
1. **Web Speech API兼容性**
   - 风险：部分浏览器不支持或支持不完整
   - 缓解：提供降级方案，使用文本提示替代

2. **大量连线渲染性能**
   - 风险：同时显示过多连线可能影响性能
   - 缓解：实现LOD和批处理优化

3. **实时数据同步**
   - 风险：WebSocket连接不稳定导致数据丢失
   - 缓解：添加重连机制和数据缓存

### 业务风险
1. **API接口变更**
   - 风险：外部API接口不稳定或频繁变更
   - 缓解：使用适配器模式，便于快速调整

2. **数据准确性**
   - 风险：弧段数据不准确影响系统可靠性
   - 缓解：添加数据验证和人工确认机制

## 八、后续建议

1. **监控和日志**
   - 添加用户行为分析
   - 实现错误日志收集和分析

2. **可扩展性**
   - 预留接口，支持更多地理要素类型
   - 设计插件架构，支持自定义图层

3. **用户体验**
   - 收集用户反馈，持续优化界面
   - 添加快捷键支持，提高操作效率

4. **国际化**
   - 完善多语言支持
   - 支持不同时区的用户

---

**文档版本：** 2.0
**最后更新：** 2025-12-22
**下次评审：** 2025-12-29