/**
 * [INPUT]: 依赖 visuals/roadMap 的原路线图 Canvas 引擎与 React 生命周期
 * [OUTPUT]: 对外提供 ReactYgbRoadMapBg
 * [POS]: React 云柜宝 Hero 的背景适配器，绘制逻辑与 Vue 共用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from "react";
import { mountRoadMap } from "../../visuals/roadMap";
export function ReactYgbRoadMapBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (canvasRef.current) return mountRoadMap(canvasRef.current); }, []);
  return <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />;
}
