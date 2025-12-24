/**
 * 弧段倒计时组件
 * 显示弧段入境倒计时信息
 */

import { Clock } from 'lucide-react';
import React, { useMemo } from 'react';
import type { ArcWithStatus } from '../../types/arc.types';
import { formatCountdown, formatTimeRange } from '../../utils/arcTimeUtils';

interface ArcCountdownProps {
  arc: ArcWithStatus;
  showIcon?: boolean;
  compact?: boolean;
}

/**
 * 弧段倒计时组件
 */
export const ArcCountdown: React.FC<ArcCountdownProps> = ({
  arc,
  showIcon = true,
  compact = false
}) => {
  // 实时倒计时文本
  const countdownText = useMemo(() => {
    if (arc.status === 'active') {
      return '活跃中';
    }
    return formatCountdown(arc.timeToStart);
  }, [arc.timeToStart, arc.status]);

  // 完整描述文本
  const fullText = useMemo(() => {
    if (arc.status === 'active') {
      return `${arc.satName}卫星已入境${arc.siteName}信关站`;
    }
    return `${arc.satName}卫星将于${countdownText}后入境${arc.siteName}信关站`;
  }, [arc.satName, arc.siteName, countdownText, arc.status]);

  // 时间范围文本
  const timeRangeText = useMemo(() => {
    return formatTimeRange(arc.startTime, arc.endTime);
  }, [arc.startTime, arc.endTime]);

  // 样式类名
  const getStatusColor = () => {
    switch (arc.status) {
      case 'active':
        return 'text-emerald-400';
      case 'upcoming':
        return 'text-cyan-400';
      default:
        return 'text-slate-500';
    }
  };

  const getStatusBgColor = () => {
    switch (arc.status) {
      case 'active':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'upcoming':
        return 'bg-cyan-500/10 border-cyan-500/30';
      default:
        return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        {showIcon && <Clock size={12} />}
        <span className="text-xs font-mono">{countdownText}</span>
      </div>
    );
  }

  return (
    <div className={`px-3 py-2 rounded border ${getStatusBgColor()}`}>
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        {showIcon && <Clock size={14} className="shrink-0" />}
        <span className="text-xs font-medium">{fullText}</span>
      </div>
      <div className="text-[10px] text-slate-500 mt-1 font-mono">
        {timeRangeText}
      </div>
    </div>
  );
};

export default ArcCountdown;
