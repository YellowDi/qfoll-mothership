/**
 * [INPUT]: 依赖品牌 DOM 的文字行矩形与背景容器坐标
 * [OUTPUT]: 对外提供 ExclusionRect 类型 (相对 root 左上角的 CSS 像素矩形) 与 collectTextExclusions，合并文字行及行间桥接排除区域
 * [POS]: 品牌背景的文字避让几何，确保点阵不会穿透正文和特性行
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export interface ExclusionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MergeOptions {
  padX?: number;
  padY?: number;
  joinGap?: number;
}

/* 同一行的若干客户端矩形的包围盒，cy 为行中线 */
interface Line {
  x: number;
  y: number;
  right: number;
  bottom: number;
  cy: number;
}

const mergeLineRects = (rects: ExclusionRect[], options: MergeOptions = {}): ExclusionRect[] => {
  const padX = options.padX ?? 4;
  const padY = options.padY ?? 4;
  const joinGap = options.joinGap ?? 10;
  const sorted = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: Line[] = [];

  for (const rect of sorted) {
    const cy = rect.y + rect.height * 0.5;
    const line = lines.find((item) => Math.abs(cy - item.cy) <= Math.max(4, rect.height * 0.55));
    if (!line) {
      lines.push({
        x: rect.x,
        y: rect.y,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height,
        cy,
      });
      continue;
    }
    line.x = Math.min(line.x, rect.x);
    line.y = Math.min(line.y, rect.y);
    line.right = Math.max(line.right, rect.x + rect.width);
    line.bottom = Math.max(line.bottom, rect.y + rect.height);
    line.cy = (line.y + line.bottom) * 0.5;
  }

  const expanded = lines
    .map((line) => ({
      x: line.x - padX,
      y: line.y - padY,
      width: line.right - line.x + padX * 2,
      height: line.bottom - line.y + padY * 2,
    }))
    .sort((a, b) => a.y - b.y);

  const bridges: ExclusionRect[] = [];
  for (let i = 1; i < expanded.length; i += 1) {
    const prev = expanded[i - 1];
    const next = expanded[i];
    const prevBottom = prev.y + prev.height;
    const gap = next.y - prevBottom;
    if (gap <= 0 || gap > joinGap) continue;
    const x = Math.min(prev.x, next.x);
    const right = Math.max(prev.x + prev.width, next.x + next.width);
    bridges.push({
      x,
      y: prevBottom,
      width: right - x,
      height: gap,
    });
  }
  return [...expanded, ...bridges];
};

const collectTextRects = (element: Element | null | undefined, rootRect: DOMRect | null | undefined): ExclusionRect[] => {
  if (!element || !rootRect) return [];
  const range = document.createRange();
  range.selectNodeContents(element);
  const raw = Array.from(range.getClientRects())
    .map((rect) => ({
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height,
    }))
    .filter((rect) => rect.width > 1 && rect.height > 1);
  return mergeLineRects(raw, { padX: 5, padY: 4, joinGap: 14 });
};

export function collectTextExclusions(root: Element, elements: Array<Element | null | undefined>): ExclusionRect[] {
  const rect = root.getBoundingClientRect();
  return elements.flatMap((element) => collectTextRects(element, rect));
}
