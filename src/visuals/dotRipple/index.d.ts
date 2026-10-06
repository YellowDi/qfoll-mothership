/**
 * [INPUT]: 描述同目录 index.js 与 params.js 的运行时导出
 * [OUTPUT]: 对外提供 DotRippleParams、DotRippleOptions、DotRippleHandle 与 mountDotRipple 声明
 * [POS]: dotRipple 点阵涟漪引擎的 TypeScript 契约；参数键与 params.js 的 PARAM_SPEC 一一对应
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ExclusionRect } from "../textExclusions";

export interface DotRippleParams {
  cell: number;
  gain: number;
  pointer: number;
  brush: number;
  trailFade: number;
  burst: number;
}

export interface DotRippleOptions {
  /* 字符单色 [r, g, b]，由页面按底色决定，引擎不感知主题 */
  ink?: readonly [number, number, number];
  paused?: boolean;
  params?: Partial<DotRippleParams>;
}

export interface DotRippleHandle {
  setParams(next: Partial<DotRippleParams>): void;
  setInk(next: readonly [number, number, number]): void;
  setExclusions(next: ExclusionRect[] | null | undefined): void;
  setPaused(next: boolean): void;
  getFps(): number;
  dispose(): void;
}

export function mountDotRipple(canvas: HTMLCanvasElement, options?: DotRippleOptions): DotRippleHandle;
