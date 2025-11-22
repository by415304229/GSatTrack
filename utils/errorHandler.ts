/**
 * TLE文件导入功能的错误处理工具
 * 提供统一的错误类型定义、错误消息映射和错误处理函数
 */

// 错误类型枚举
export enum TLEImportErrorType {
  FILE_TYPE_ERROR = 'file_type_error',
  FILE_SIZE_ERROR = 'file_size_error',
  FILE_EMPTY_ERROR = 'file_empty_error',
  FILE_READ_ERROR = 'file_read_error',
  TLE_FORMAT_ERROR = 'tle_format_error',
  TLE_VALIDATION_ERROR = 'tle_validation_error',
  PARSE_ERROR = 'parse_error',
  SATELLITE_DATA_EMPTY = 'satellite_data_empty',
  UNKNOWN_ERROR = 'unknown_error'
}

// 错误信息映射
export const ERROR_MESSAGES: Record<TLEImportErrorType, string> = {
  [TLEImportErrorType.FILE_TYPE_ERROR]: '不支持的文件类型。请上传.tle或.txt格式的文件。',
  [TLEImportErrorType.FILE_SIZE_ERROR]: '文件大小超过限制。请上传小于10MB的文件。',
  [TLEImportErrorType.FILE_EMPTY_ERROR]: '文件内容为空。请上传包含TLE数据的有效文件。',
  [TLEImportErrorType.FILE_READ_ERROR]: '读取文件时出错。请检查文件是否可读，然后重试。',
  [TLEImportErrorType.TLE_FORMAT_ERROR]: 'TLE数据格式错误。请确保文件符合标准TLE格式规范。',
  [TLEImportErrorType.TLE_VALIDATION_ERROR]: 'TLE数据验证失败。请检查文件内容是否完整正确。',
  [TLEImportErrorType.PARSE_ERROR]: '解析卫星数据时出错。文件可能包含格式错误的数据。',
  [TLEImportErrorType.SATELLITE_DATA_EMPTY]: '无法从文件中解析出有效的卫星数据。',
  [TLEImportErrorType.UNKNOWN_ERROR]: '发生未知错误。请稍后重试或联系技术支持。'
};

// 错误严重程度枚举
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 错误信息接口
export interface TLEImportError {
  type: TLEImportErrorType;
  message: string;
  severity: ErrorSeverity;
  details?: string;
  timestamp: Date;
}

/**
 * 创建一个标准化的错误对象
 * @param type 错误类型
 * @param customMessage 自定义错误消息（可选）
 * @param details 错误详细信息（可选）
 * @returns 标准化的错误对象
 */
export const createError = (
  type: TLEImportErrorType,
  customMessage?: string,
  details?: string
): TLEImportError => {
  return {
    type,
    message: customMessage || ERROR_MESSAGES[type],
    severity: getErrorSeverity(type),
    details,
    timestamp: new Date()
  };
};

/**
 * 根据错误类型确定严重程度
 * @param type 错误类型
 * @returns 错误严重程度
 */
export const getErrorSeverity = (type: TLEImportErrorType): ErrorSeverity => {
  switch (type) {
    case TLEImportErrorType.FILE_TYPE_ERROR:
    case TLEImportErrorType.FILE_SIZE_ERROR:
    case TLEImportErrorType.FILE_EMPTY_ERROR:
      return ErrorSeverity.WARNING;
    case TLEImportErrorType.FILE_READ_ERROR:
    case TLEImportErrorType.TLE_FORMAT_ERROR:
    case TLEImportErrorType.TLE_VALIDATION_ERROR:
    case TLEImportErrorType.PARSE_ERROR:
    case TLEImportErrorType.SATELLITE_DATA_EMPTY:
      return ErrorSeverity.ERROR;
    case TLEImportErrorType.UNKNOWN_ERROR:
      return ErrorSeverity.CRITICAL;
    default:
      return ErrorSeverity.ERROR;
  }
};

/**
 * 获取错误对应的CSS类名，用于样式化不同严重程度的错误提示
 * @param severity 错误严重程度
 * @returns CSS类名字符串
 */
export const getErrorClassName = (severity: ErrorSeverity): string => {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case ErrorSeverity.WARNING:
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case ErrorSeverity.ERROR:
      return 'bg-red-50 border-red-200 text-red-800';
    case ErrorSeverity.CRITICAL:
      return 'bg-purple-50 border-purple-200 text-purple-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

/**
 * 格式化错误信息用于显示
 * @param error 错误对象
 * @returns 格式化后的错误信息字符串
 */
export const formatErrorMessage = (error: TLEImportError): string => {
  let message = error.message;
  if (error.details) {
    message += `\n详细信息: ${error.details}`;
  }
  return message;
};

/**
 * 处理文件验证错误
 * @param file 文件对象
 * @returns 如果有错误返回错误对象，否则返回null
 */
export const validateFile = (file: File): TLEImportError | null => {
  // 检查文件类型
  const validExtensions = ['.tle', '.txt'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return createError(TLEImportErrorType.FILE_TYPE_ERROR);
  }
  
  // 检查文件大小（10MB限制）
  const maxSizeInBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return createError(TLEImportErrorType.FILE_SIZE_ERROR);
  }
  
  // 检查文件是否为空
  if (file.size === 0) {
    return createError(TLEImportErrorType.FILE_EMPTY_ERROR);
  }
  
  return null;
};

/**
 * 通用错误处理包装函数
 * @param operation 要执行的操作
 * @param errorType 错误类型
 * @param customMessage 自定义错误消息（可选）
 * @returns 包含操作结果或错误信息的对象
 */
export const handleError = <T,>(
  operation: () => T,
  errorType: TLEImportErrorType,
  customMessage?: string
): { success: boolean; result?: T; error?: TLEImportError } => {
  try {
    const result = operation();
    return { success: true, result };
  } catch (e) {
    const error = e as Error;
    return {
      success: false,
      error: createError(
        errorType,
        customMessage || error.message || ERROR_MESSAGES[errorType],
        error.stack
      )
    };
  }
};

/**
 * 异步错误处理包装函数
 * @param operation 要执行的异步操作
 * @param errorType 错误类型
 * @param customMessage 自定义错误消息（可选）
 * @returns 包含操作结果或错误信息的Promise
 */
export const handleAsyncError = async <T,>(
  operation: () => Promise<T>,
  errorType: TLEImportErrorType,
  customMessage?: string
): Promise<{ success: boolean; result?: T; error?: TLEImportError }> => {
  try {
    const result = await operation();
    return { success: true, result };
  } catch (e) {
    const error = e as Error;
    return {
      success: false,
      error: createError(
        errorType,
        customMessage || error.message || ERROR_MESSAGES[errorType],
        error.stack
      )
    };
  }
};