/**
 * 中国国境线2D渲染组件
 * 在Canvas上绘制国境线
 */

import type { GeographicBoundary } from '../../types/geographic.types';
import { Boundary2DCoordinates } from '../../utils/geographic/coordinateConverter';

/**
 * 中国国境线2D渲染类
 */
export class ChinaBorder2D {
  private renderer: Boundary2DCoordinates;

  constructor(boundary: GeographicBoundary) {
    this.renderer = new Boundary2DCoordinates(boundary);
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

    // 设置样式
    ctx.strokeStyle = style?.color || '#ef4444';
    ctx.lineWidth = style?.strokeWidth || 2;
    ctx.globalAlpha = style?.opacity ?? 0.8;

    if (style?.dashArray) {
      ctx.setLineDash(style.dashArray);
    }

    ctx.stroke();
    ctx.restore();
  }
}

export default ChinaBorder2D;
