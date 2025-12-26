/**
 * 弧段Shader工具函数
 * 用于3D虚线流动效果
 */

import * as THREE from 'three';

/**
 * 虚线Vertex Shader
 * 使用世界坐标计算线段位置
 */
export const DASHED_LINE_VERTEX_SHADER = `
  varying float vLinePos;
  void main() {
    // 将位置传递给fragment shader
    vLinePos = position.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * 虚线Fragment Shader
 * 实现流动虚线效果
 */
export const DASHED_LINE_FRAGMENT_SHADER = `
  uniform float time;
  uniform vec3 color;
  uniform float dashSize;
  uniform float gapSize;
  uniform float opacity;

  varying float vLinePos;

  void main() {
    // 使用世界坐标位置创建重复模式
    float patternLength = 0.1; // 模式重复的间距
    float linePos = mod(vLinePos + time * 0.5, patternLength);
    float dashLength = patternLength * dashSize;
    float alpha = step(linePos, dashLength) * opacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Shader Uniforms接口
 */
export interface DashUniforms {
  time: { value: number };
  color: { value: THREE.Color };
  dashSize: { value: number };
  gapSize: { value: number };
  opacity: { value: number };
}

/**
 * 解析颜色字符串，提取RGB和透明度
 * @param colorStr 颜色字符串，支持 #rgb, #rrggbb, rgba(), rgb()
 * @returns { rgb: string, alpha: number }
 */
function parseColor(colorStr: string): { rgb: string; alpha: number } {
  // 处理 rgba() 格式
  const rgbaMatch = colorStr.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0;
    return {
      rgb: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`,
      alpha: a
    };
  }

  // 处理 #hex 格式
  if (colorStr.startsWith('#')) {
    return { rgb: colorStr, alpha: 1.0 };
  }

  // 默认返回
  return { rgb: '#ffffff', alpha: 1.0 };
}

/**
 * 创建默认的虚线Uniforms
 */
export const createDefaultDashUniforms = (
  color: string,
  baseOpacity: number
): DashUniforms => {
  const parsed = parseColor(color);
  return {
    time: { value: 0 },
    color: { value: new THREE.Color(parsed.rgb) },
    dashSize: { value: 0.5 },
    gapSize: { value: 0.5 },
    opacity: { value: baseOpacity * parsed.alpha }
  };
};
