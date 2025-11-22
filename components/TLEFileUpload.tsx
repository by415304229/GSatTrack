import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { validateTLEContent } from '../utils/tleValidator';
import { parseTLEContent, ParsedSatellite } from '../utils/tleParser';
import {
  createError,
  validateFile,
  getErrorClassName,
  formatErrorMessage,
  TLEImportError,
  TLEImportErrorType,
  getErrorSeverity,
  handleError,
  handleAsyncError
} from '../utils/errorHandler';

interface TLEFileUploadProps {
  onFileUpload: (file: File, content: string, parsedSatellites: ParsedSatellite[]) => void;
  disabled?: boolean;
}

const TLEFileUpload: React.FC<TLEFileUploadProps> = ({ onFileUpload, disabled = false }) => {
  const [uploadError, setUploadError] = useState<TLEImportError | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // 重置文件输入，允许选择相同文件多次
    e.target.value = '';
  };

  // 读取文件内容
  const readFileContent = (file: File): Promise<string> => {
    return handleAsyncError<string>(
      () => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (!content) {
            reject(new Error('文件内容为空'));
          } else {
            resolve(content);
          }
        };
        reader.onerror = () => {
          reject(new Error('文件读取失败'));
        };
        reader.readAsText(file);
      }),
      TLEImportErrorType.UNKNOWN_ERROR,
      '文件读取失败'
    ).then((result) => {
      if (!result.success || !result.result) {
        throw new Error(result.error?.message || '文件读取失败');
      }
      return result.result;
    });
  };

  // 处理文件上传流程
  const processFile = async (file: File) => {
    // 重置错误状态
    setUploadError(null);
    
    try {
      // 1. 验证文件
      const fileError = validateFile(file);
      if (fileError) {
        setUploadError(fileError);
        return;
      }
      
      // 2. 读取文件内容
      const content = await readFileContent(file);
      
      // 3. 验证TLE内容
      const validationResult = validateTLEContent(content);
      if (!validationResult.isValid) {
        const error = createError(
          TLEImportErrorType.TLE_VALIDATION_ERROR,
          undefined,
          validationResult.error || 'TLE内容验证失败'
        );
        setUploadError(error);
        return;
      }
      
      // 4. 解析TLE数据
      const parseResult = handleError(
        () => parseTLEContent(content),
        TLEImportErrorType.PARSE_ERROR,
        '解析TLE数据失败'
      );
      
      if (!parseResult.success || !parseResult.result || parseResult.result.length === 0) {
          const error = createError(
            TLEImportErrorType.PARSE_ERROR,
            '解析TLE数据失败，无法提取有效卫星数据'
          );
          setUploadError(error);
        return;
      }
      
      // 5. 调用上传回调
      onFileUpload(file, content, parseResult.result);
      
    } catch (error) {
      const fileReadError = createError(
        TLEImportErrorType.FILE_READ_ERROR,
        undefined,
        error instanceof Error ? error.message : '未知错误'
      );
      setUploadError(fileReadError);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 处理拖放进入/悬停
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // 处理拖放离开
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // 处理拖放文件
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="tle-file-upload">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept=".tle,.txt"
      />
      
      <div className="flex flex-col gap-6">
        {/* Drag and drop area */}
        <div
          ref={dropZoneRef}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
            ${isDragging 
              ? 'border-cyan-500 bg-cyan-900/20' 
              : 'border-slate-700 hover:border-cyan-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={disabled ? undefined : handleClick}
          onDragOver={disabled ? undefined : handleDragOver}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDrop={disabled ? undefined : handleDrop}
        >
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <Upload size={48} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">点击或拖拽TLE文件到此区域上传</h3>
            <p className="text-sm text-slate-400">
              支持 .tle 和 .txt 格式文件，最大文件大小 10MB
            </p>
          </div>
        </div>

        {/* Traditional file upload button */}
        <div className="flex justify-center">
          <button 
            onClick={disabled ? undefined : handleClick}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-md font-medium transition-colors
              ${disabled 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-cyan-500 hover:bg-cyan-600 text-white'}
            `}
          >
            <FileText size={18} />
            选择文件上传
          </button>
        </div>

        {/* Error message */}
        {uploadError && (
          <div className={`bg-red-900/30 border rounded-lg p-4 flex items-start gap-3 ${getErrorClassName(uploadError.severity)}`}>
            <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-red-400">{uploadError.message}</h4>
                <button 
                  onClick={() => setUploadError(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              {uploadError.details && (
                <p className="text-sm text-red-300 mt-1">{uploadError.details}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TLEFileUpload;