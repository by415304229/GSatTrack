/**
 * PurestAdmin API 时间工具
 *
 * 契约：后端返回的时间字符串末尾 'Z' 是字面量字符，实际表示北京时间（UTC+8），
 * 并非 UTC。本工具去除 'Z' 后缀，由浏览器按本地时区（UTC+8）解析。
 *
 * 假设：用户浏览器时区为 Asia/Shanghai（UTC+8）。
 */

/**
 * 解析后端时间字符串为 Date 对象（按本地时区）
 * 与 new Date(timeStr) 的区别：会去除末尾的 'Z' 后缀，避免被当作 UTC 解析。
 */
export function parseApiTime(timeStr: string | null | undefined): Date | null {
  if (!timeStr) return null;
  const cleaned = timeStr.replace(/[Zz]$/, "");
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * 将本地 Date 转为后端期望的时间字符串（ISO 格式但无 Z 后缀）
 * 用于向后端发送查询参数。后端会把字符串当作北京时间解析。
 */
export function toApiLocalString(date: Date): string {
  // 减去时区偏移后取 ISO 字符串，再去除末尾 Z，得到本地时间原值的 ISO 表示
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, -1);
}
