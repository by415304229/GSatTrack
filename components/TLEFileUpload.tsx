import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { validateTLEContent } from '../utils/tleValidator';
import { parseTLEContent, ParsedSatellite } from '../utils/tleParser';

import {
  createError,
  validateFile,
  getErrorClassName,
  TLEImportError,
  TLEImportErrorType,
  handleError,
  handleAsyncError
} from '../utils/errorHandler';
import { fetchSatelliteGroups, updateSatelliteGroup, createSatelliteGroup } from '../services/satelliteService';
import type { SatelliteTLE } from '../services/satelliteService';
import { SatelliteGroup } from '../types';

interface tlefileuploadprops {
  onFileUpload: (file: File, content: string, parsedsatellites: ParsedSatellite[]) => void;
  onSatelliteGroupUpdated?: (groupid: string, satellitecount: number) => void;
  disabled?: boolean;
}

const TLEFileUpload: React.FC<tlefileuploadprops> = ({ 
  onFileUpload, 
  onSatelliteGroupUpdated,
  disabled = false 
}) => {
  const [uploadError, setUploadError] = useState<TLEImportError | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [satelliteGroups, setSatelliteGroups] = useState<SatelliteGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('new');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [updateMode, setUpdateMode] = useState<'merge' | 'replace'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // 加载现有的卫星组
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await fetchSatelliteGroups();
        setSatelliteGroups(groups);
      } catch {
        // 错误已被上层组件处理
      }
    };
    
    loadGroups();
  }, []);
  
  // 根据文件名自动识别目标卫星组
  const autoDetectSatelliteGroup = (filename: string): void => {
    const normalizedName = filename.toLowerCase().replace(/\.(tle|txt)$/, '').replace(/[_\-]/g, ' ');
    
    // 尝试根据文件名匹配现有的卫星组
    const matchedGroup = satelliteGroups.find(group => 
      group.name.toLowerCase().includes(normalizedName) || 
      normalizedName.includes(group.name.toLowerCase())
    );
    
    if (matchedGroup) {
      setSelectedGroupId(matchedGroup.id);
      setNewGroupName('');
    }

 else {
      // 如果没有匹配，默认创建新组，并使用文件名作为建议名称
      setSelectedGroupId('new');
      setNewGroupName(normalizedName);
    }
  };

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
    // 重置错误和成功状态
    setUploadError(null);
    setUploadSuccess(null);
    // 根据文件名自动识别卫星组
    autoDetectSatelliteGroup(file.name);
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
      
      // 5. 转换为SatelliteTLE格式并处理卫星组
      try {
        const parsedTles = parseResult.result;
        const satelliteTles: SatelliteTLE[] = parsedTles.map(tle => ({
          name: tle.name,
          satId: tle.noradId || tle.satId, // 使用satId字段，优先使用noradId作为值
          line1: tle.line1,
          line2: tle.line2,
          updatedAt: new Date()
        }));
        
        if (selectedGroupId === 'new') {
          // 创建新组
          if (!newGroupName.trim()) {
            throw new Error('请输入新卫星组名称');
          }
          
          const newGroup = await createSatelliteGroup(newGroupName.trim(), satelliteTles);
          setUploadSuccess(`成功创建新卫星组 "${newGroup.name}"，包含 ${satelliteTles.length} 颗卫星`);
          
          // 重新加载卫星组列表
          const updatedGroups = await fetchSatelliteGroups();
          setSatelliteGroups(updatedGroups);
          
          // 通知父组件卫星组已更新
          if (onSatelliteGroupUpdated) {
            onSatelliteGroupUpdated(newGroup.id, satelliteTles.length);
          }
        }

 else {
          // 更新现有组
          await updateSatelliteGroup({
            groupId: selectedGroupId,
            tles: satelliteTles,
            merge: updateMode === 'merge'
          });
          const updatedGroups = await fetchSatelliteGroups();
          setSatelliteGroups(updatedGroups);
          const targetGroup = updatedGroups.find(g => g.id === selectedGroupId);
          const operation = updateMode === 'merge' ? '合并' : '替换';
          setUploadSuccess(`成功${operation}卫星组 "${targetGroup?.name || '未知'}"，更新了 ${satelliteTles.length} 颗卫星`);
          
          // 通知父组件卫星组已更新
          if (onSatelliteGroupUpdated) {
            onSatelliteGroupUpdated(selectedGroupId, satelliteTles.length);
          }
        }
      } catch (groupError) {
        const error = createError(
          TLEImportErrorType.UNKNOWN_ERROR,
          undefined,
          `处理卫星组时出错: ${groupError instanceof Error ? groupError.message : '未知错误'}`
        );
        setUploadError(error);
        return;
      }
      
      // 6. 调用上传回调
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

  const handleclick = () => {
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
        {/* 卫星组选择区域 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">目标卫星组</h3>
          <div className="space-y-3">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={disabled}
            >
              <option value="new">创建新卫星组</option>
              {satelliteGroups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            
            {selectedGroupId === 'new' && (
              <input
                type="text"
                placeholder="输入新卫星组名称"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                disabled={disabled}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            )}
            
            {selectedGroupId !== 'new' && (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">更新模式</p>
                <select
                  value={updateMode}
                  onChange={(e) => setUpdateMode(e.target.value as 'merge' | 'replace')}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={disabled}
                >
                  <option value="merge">合并（保留现有数据，添加或更新卫星）</option>
                  <option value="replace">替换（完全替换组内所有卫星）</option>
                </select>
              </div>
            )}
          </div>
        </div>
        
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
          onClick={disabled ? undefined : handleclick}
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
            onClick={disabled ? undefined : handleclick}
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

        {/* Success message */}
        {uploadSuccess && (
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 flex items-start gap-3">
            <svg className="text-green-500 mt-0.5 flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-green-400">成功</h4>
                <button 
                  onClick={() => setUploadSuccess(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-green-300 mt-1">{uploadSuccess}</p>
            </div>
          </div>
        )}

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