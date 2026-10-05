/**
 * [INPUT]: 依赖 visuals/dotRipple 的 mountDotRipple 引擎、主题上下文与调用方给出的文字避让矩形
 * [OUTPUT]: 对外提供 ReactDotRippleBg
 * [POS]: 水环境 Hero 的点阵涟漪适配器，只负责挂载并同步字符颜色与避让区域；底色由页面渐变承担，波形与字符逻辑全在引擎内
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from "react";
import { mountDotRipple } from "../../visuals/dotRipple";
import { useTheme } from "../providers/ThemeProvider";
import type { DotExclusion } from "./ReactTwinkleDotMatrixBg";

/* 深色渐变上用白字，浅色渐变 (#d4ebf7 一带) 上白字不可读，改用深靛 */
const inkFor = (isDark: boolean) => (isDark ? [255, 255, 255] : [67, 56, 202]);

export function ReactDotRippleBg({ excludeRects }: { excludeRects: DotExclusion[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<ReturnType<typeof mountDotRipple> | null>(null);
  const { isDark } = useTheme();
  useEffect(() => {
    if (!canvasRef.current) return;
    apiRef.current = mountDotRipple(canvasRef.current, { ink: inkFor(isDark) });
    return () => { apiRef.current?.dispose(); apiRef.current = null; };
  }, []);
  useEffect(() => apiRef.current?.setInk(inkFor(isDark)), [isDark]);
  useEffect(() => apiRef.current?.setExclusions(excludeRects), [excludeRects]);
  return <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />;
}
