/**
 * PurestAdmin API 类型定义
 * 根据实际 API 文档定义的数据结构
 */

/**
 * 登录请求参数
 */
export interface LoginRequest {
  account: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  id: number;
  name: string;
}

/**
 * 卫星基础信息（来自 API）
 */
export interface APISatellite {
  satID: number;
  parentID?: number;
  sateliteName: string;
  bindTMJudgeGroupID?: number;
  isEnable?: boolean;
  scid?: number;
  layer?: number;
  shortName?: string;
  nordID?: number;
  satelliteStatus?: number;  // 0=停用, 1=启用, 2=维护中
  saveTime?: string;
  operator?: string;
  // 计算属性
  satelliteStatusText?: string;
  saveTimeFormatted?: string;
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  pageIndex?: number;
  pageSize?: number;
}

/**
 * 弧段查询参数
 */
export interface ArcQueryParams extends PaginationParams {
  taskID?: number;
  scid?: string;
  satName?: string;
  channelType?: string;
  siteName?: string;
  startTimeBegin?: string;
  startTimeEnd?: string;
  endTimeBegin?: string;
  endTimeEnd?: string;
}

/**
 * 弧段数据
 */
export interface ArcSegment {
  taskID: number;
  scid: string;
  satName: string;
  channelType: string;
  upSwitch: string;
  siteName: string;
  startTime: string;
  endTime: string;
  searchTime?: string;
  // 格式化时间
  startTimeFormatted?: string;
  endTimeFormatted?: string;
  searchTimeFormatted?: string;
}

/**
 * 分页响应结构
 */
export interface PagedList<T> {
  pageIndex: number;
  pageSize: number;
  total: number;
  pageCount: number;
  items: T[];
  // 有些接口可能用 Data 字段
  data?: T[];
}

/**
 * 遥测单元数据
 */
export interface TelemetryUnit {
  tmNum: string;
  tmName: string;
  packageName: string;
  pid: number;
  subsystemName: string;
}

/**
 * 遥测查询参数
 */
export interface TelemetryQueryParams extends PaginationParams {
  groupId: number;
}
