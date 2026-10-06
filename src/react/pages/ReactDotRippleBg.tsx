/**
 * [INPUT]: 依赖 visuals/dotRipple 的 mountDotRipple 引擎与调用方给出的避让矩形
 * [OUTPUT]: 对外提供 ReactDotRippleBg
 * [POS]: 水环境视频 Hero 的点阵涟漪适配器，只负责挂载并同步避让区域；视频明暗主题下是同一段素材，字符恒为白，颜色决策不依赖主题
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from "react";
import { mountDotRipple } from "../../visuals/dotRipple";
import type { DotExclusion } from "./ReactTwinkleDotMatrixBg";

export function ReactDotRippleBg({ excludeRects }: { excludeRects: DotExclusion[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<ReturnType<typeof mountDotRipple> | null>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    apiRef.current = mountDotRipple(canvasRef.current);
    return () => { apiRef.current?.dispose(); apiRef.current = null; };
  }, []);
  useEffect(() => apiRef.current?.setExclusions(excludeRects), [excludeRects]);
  return <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />;
}
