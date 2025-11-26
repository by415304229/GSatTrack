import { AlertCircle, FileText, Upload, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { parseTLEContent, type ParsedSatellite } from '../utils/tleParser';
import { validateTLEContent } from '../utils/tleValidator';

import type { SatelliteTLE } from '../services/satelliteService';
import { fetchSatelliteGroups, updateSatelliteGroup } from '../services/satelliteService';
import { type SatelliteGroup } from '../types';

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [satelliteGroups, setSatelliteGroups] = useState<SatelliteGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 加载现有的卫星组
  useEffect(() => {
    const loadGroups = async () => {
      try {
        console.log('加载卫星组...');
        const groups = await fetchSatelliteGroups();
        setSatelliteGroups(groups);
        // 默认选择第一个卫星组
        if (groups.length > 0) {
          setSelectedGroupId(groups[0].id);
          console.log(`默认选择卫星组: ${groups[0].name} (${groups[0].id})`);
        }
        console.log(`加载完成，共 ${groups.length} 个卫星组`);
      } catch (error) {
        console.error('加载卫星组失败:', error);
      }
    };

    loadGroups();
  }, []);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('用户选择了文件:', file.name);
      processFile(file);
    }
    // 重置文件输入，允许选择相同文件多次
    e.target.value = '';
  };

  // 读取文件内容
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
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
    });
  };

  // 处理文件上传流程
  const processFile = async (file: File) => {
    // 重置错误和成功状态
    setUploadError(null);
    setUploadSuccess(null);

    console.log('开始处理文件:', file.name);

    if (!selectedGroupId) {
      const errorMsg = '请选择目标卫星组';
      setUploadError(errorMsg);
      console.error(errorMsg);
      return;
    }

    try {
      console.log('选择的卫星组ID:', selectedGroupId);

      // 1. 读取文件内容
      console.log('读取文件内容...');
      const content = await readFileContent(file);
      console.log('文件内容读取成功，长度:', content.length);

      // 2. 验证TLE内容
      console.log('验证TLE内容...');
      const validationResult = validateTLEContent(content);
      if (!validationResult.isValid) {
        const errorMsg = validationResult.error || 'TLE内容验证失败';
        setUploadError(errorMsg);
        console.error('TLE内容验证失败:', errorMsg);
        return;
      }
      console.log('TLE内容验证通过');

      // 3. 解析TLE数据
      console.log('解析TLE数据...');
      const parsedSatellites = parseTLEContent(content);
      if (!parsedSatellites || parsedSatellites.length === 0) {
        const errorMsg = '解析TLE数据失败，无法提取有效卫星数据';
        setUploadError(errorMsg);
        console.error(errorMsg);
        return;
      }
      console.log(`解析成功，共 ${parsedSatellites.length} 颗卫星`);

      // 4. 转换为SatelliteTLE格式并更新卫星组
      console.log('转换为SatelliteTLE格式...');
      const satelliteTles: SatelliteTLE[] = parsedSatellites.map(tle => ({
        name: tle.name,
        satId: tle.noradId || tle.satId,
        line1: tle.line1,
        line2: tle.line2,
        updatedAt: new Date(),
        id: tle.noradId || tle.satId
      }));
      console.log('格式转换完成');

      // 更新现有组，默认使用合并模式
      console.log('更新卫星组...');
      const updatedGroups = await updateSatelliteGroup({
        groupId: selectedGroupId,
        tles: satelliteTles,
        merge: true
      });
      console.log('卫星组更新成功');

      // 获取更新后的目标组
      const targetGroup = updatedGroups.find(g => g.id === selectedGroupId);
      const successMsg = `成功更新卫星组 "${targetGroup?.name || '未知'}"，处理了 ${satelliteTles.length} 颗卫星`;
      setUploadSuccess(successMsg);
      console.log(successMsg);

      // 通知父组件卫星组已更新
      if (onSatelliteGroupUpdated) {
        onSatelliteGroupUpdated(selectedGroupId, satelliteTles.length);
        console.log('通知父组件卫星组已更新');
      }

      // 调用上传回调
      onFileUpload(file, content, parsedSatellites);
      console.log('上传回调调用完成');

    } catch (error) {
      console.error('文件上传失败:', error);
      setUploadError(error instanceof Error ? error.message : '未知错误');
    }
  };

  const handleclick = () => {
    if (fileInputRef.current) {
      console.log('用户点击了选择文件按钮');
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
      console.log('用户拖放了文件:', file.name);
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
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                console.log('用户选择了卫星组:', e.target.value);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={disabled || satelliteGroups.length === 0}
            >
              {satelliteGroups.length === 0 ? (
                <option value="">加载中...</option>
              ) : (
                satelliteGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))
              )}
            </select>
            <p className="text-xs text-slate-500">
              选择要更新的卫星组，上传的TLE数据将合并到该组中
            </p>
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
              支持 .tle 和 .txt 格式文件
            </p>
          </div>
        </div>

        {/* Traditional file upload button */}
        <div className="flex justify-center">
          <button
            onClick={disabled ? undefined : handleclick}
            disabled={disabled || satelliteGroups.length === 0}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-md font-medium transition-colors
              ${disabled || satelliteGroups.length === 0
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
                  onClick={() => {
                    setUploadSuccess(null);
                    console.log('用户关闭了成功消息');
                  }}
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
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-red-400">错误</h4>
                <button
                  onClick={() => {
                    setUploadError(null);
                    console.log('用户关闭了错误消息');
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-red-300 mt-1">{uploadError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TLEFileUpload;