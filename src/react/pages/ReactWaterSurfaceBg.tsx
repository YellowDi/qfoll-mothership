/**
 * [INPUT]: 依赖 visuals/waterSurface 的原 WebGL 着色器与 React 生命周期
 * [OUTPUT]: 对外提供 ReactWaterSurfaceBg
 * [POS]: React 水环境背景适配器，保留原版波浪厚度、光色与帧率
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from "react";
import { mountWaterSurface } from "../../visuals/waterSurface";
export function ReactWaterSurfaceBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) return mountWaterSurface(canvasRef.current, () => document.documentElement.classList.contains("dark"));
  }, []);
  return <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />;
}
