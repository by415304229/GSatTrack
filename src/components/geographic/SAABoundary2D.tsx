/**
 * SAA区域2D渲染组件
 * 在Canvas上绘制SAA区域
 */

import type { SAABoundary } from '../../types/geographic.types';
import { Boundary2DCoordinates } from '../../utils/geographic/coordinateConverter';

/**
 * SAA区域2D渲染类
 */
export class SAABoundary2D {
  private renderer: Boundary2DCoordinates;

  constructor(saaBoundary: SAABoundary) {
    this.renderer = new Boundary2DCoordinates(saaBoundary);
  }

  /**
   * 更新2D坐标（响应地图尺寸变化）
   */
  update(width: number, height: number): void {
    this.renderer.update(width, height);
  }

  /**
   * 在Canvas上绘制
   */
  draw(ctx: CanvasRenderingContext2D): void {
    const coords = this.renderer.getCoordinates();
    if (coords.length === 0) {
      return;
    }

    const style = this.renderer.getStyle();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);

    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(coords[i].x, coords[i].y);
    }

    ctx.closePath();

    // 绘制填充
    if (style?.fill) {
      ctx.fillStyle = style.fill;
      ctx.globalAlpha = style.fillOpacity ?? 0.15;
      ctx.fill();
    }

    // 绘制边界
    ctx.strokeStyle = style?.color || '#fbbf24';
    ctx.lineWidth = style?.strokeWidth || 2;
    ctx.globalAlpha = style?.opacity ?? 0.6;

    if (style?.dashArray) {
      ctx.setLineDash(style.dashArray);
    }

    ctx.stroke();
    ctx.restore();
  }
}

export default SAABoundary2D;
