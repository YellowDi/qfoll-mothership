/**
 * [INPUT]: 依赖原点阵引擎、主题上下文与品牌文字排除区域
 * [OUTPUT]: 对外提供 ReactTwinkleDotMatrixBg 和 DotExclusion 类型
 * [POS]: React 品牌区的点阵适配器，保留原点尺寸、闪烁概率、指针轨迹和文字避让
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from "react";
import { mountTwinkleDots } from "../../visuals/twinkleDots";
import type { ExclusionRect } from "../../visuals/textExclusions";
import { useTheme } from "../providers/ThemeProvider";
export type DotExclusion = ExclusionRect;
export function ReactTwinkleDotMatrixBg({ excludeRects }: { excludeRects: DotExclusion[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDark } = useTheme();
  useEffect(() => {
    if (!canvasRef.current) return;
    return mountTwinkleDots(canvasRef.current, {
      cellSize: 7, dotSize: 5, baseOpacity: isDark ? .12 : .26,
      baseColor: isDark ? "#52525b" : "#e4e4e7",
      twinkleColor: isDark ? "#fb8a6a" : "#ff6f4f",
      twinkleIntensity: isDark ? 1.02 : 1.24, twinkleRate: isDark ? .0054 : .0062,
      minDuration: 600, maxDuration: 1600, cooldownMin: 800, cooldownMax: 3000,
      maxActiveTwinkles: isDark ? 96 : 110, enablePointerTrail: true,
      trailLife: 520, trailIntensity: .54, excludeRects,
    });
  }, [isDark, excludeRects]);
  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
