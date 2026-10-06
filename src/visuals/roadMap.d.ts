/**
 * [INPUT]: 描述同目录 roadMap.js 的运行时导出
 * [OUTPUT]: 对外提供 mountRoadMap 声明
 * [POS]: 路线图背景引擎的 TypeScript 契约，返回清理函数
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export function mountRoadMap(canvas: HTMLCanvasElement): () => void;
