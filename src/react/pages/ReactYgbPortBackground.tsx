/**
 * [INPUT]: 依赖 visuals/ygbPort 的 mountYgbPort 港区引擎、ThemeProvider 的主题状态与 React 生命周期
 * [OUTPUT]: 对外提供 ReactYgbPortBackground，挂载云柜宝港区 Canvas 背景并同步主题与暂停
 * [POS]: React 云柜宝 Hero 的背景适配器，绘制逻辑全部位于 visuals/ygbPort
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from "react";
import { mountYgbPort, type PortHandle } from "../../visuals/ygbPort";
import { useTheme } from "../providers/ThemeProvider";


export interface ReactYgbPortBackgroundProps {
  isDark?: boolean;
  paused?: boolean;
  className?: string;
}

export function ReactYgbPortBackground({ isDark, paused = false, className = "block h-full w-full" }: ReactYgbPortBackgroundProps) {
  const theme = useTheme();
  const dark = isDark ?? theme.isDark;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<PortHandle | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const handle = mountYgbPort(canvasRef.current, { dark, paused });
    handleRef.current = handle;
    return () => {
      handle.dispose();
      handleRef.current = null;
    };
  }, []);
  useEffect(() => handleRef.current?.setTheme(dark), [dark]);
  useEffect(() => handleRef.current?.setPaused(paused), [paused]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
