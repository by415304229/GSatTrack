import React from 'react';
import { X, FileText } from 'lucide-react';
import TLEFileUpload from './TLEFileUpload';

interface TLEImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File, content: string, parsedSatellites: any[]) => void;
  onSatelliteGroupUpdated: (groupId: string, satelliteCount: number) => void;
}

const TLEImportModal: React.FC<TLEImportModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  onSatelliteGroupUpdated
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-[#020617] border border-slate-700 rounded-md shadow-2xl w-[90%] max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText size={16} className="text-cyan-400" />
            <span>TLE文件导入</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <TLEFileUpload
            onFileUpload={onFileUpload}
            onSatelliteGroupUpdated={onSatelliteGroupUpdated}
          />
        </div>
      </div>
    </div>
  );
};

export default TLEImportModal;