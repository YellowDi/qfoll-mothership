/**
 * [INPUT]: 描述同目录 textExclusions.js 的运行时导出
 * [OUTPUT]: 对外提供 ExclusionRect 类型与 collectTextExclusions 声明
 * [POS]: 点阵背景文字避让的 TypeScript 契约，矩形坐标系相对 root 左上角
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export interface ExclusionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function collectTextExclusions(root: Element, elements: Array<Element | null | undefined>): ExclusionRect[];
