/**
 * [INPUT]: 描述同目录 twinkleDots.js 的运行时导出
 * [OUTPUT]: 对外提供 TwinkleDotsProps 与 mountTwinkleDots 声明
 * [POS]: 闪烁点阵背景引擎的 TypeScript 契约；数值参数由引擎内部 clamp，范围见实现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ExclusionRect } from "./textExclusions";

export interface TwinkleDotsProps {
  cellSize: number;
  dotSize: number;
  baseOpacity: number;
  baseColor: string;
  twinkleColor: string;
  twinkleIntensity: number;
  twinkleRate: number;
  minDuration: number;
  maxDuration: number;
  cooldownMin: number;
  cooldownMax: number;
  maxActiveTwinkles: number;
  enablePointerTrail: boolean;
  trailLife: number;
  trailIntensity: number;
  excludeRects?: ExclusionRect[];
}

export function mountTwinkleDots(canvas: HTMLCanvasElement, props: TwinkleDotsProps): () => void;
