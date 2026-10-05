/**
 * [INPUT]: 依赖 Canvas 2D、容器尺寸、主题类和减少动画偏好
 * [OUTPUT]: 对外提供水环境 Hero 的动态水面背景
 * [POS]: 水环境产品页的沉浸式装饰层，承接原 WebGL 波浪的视觉职责
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from "react";

const drawSurface = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, dark: boolean) => {
  ctx.clearRect(0, 0, width, height);
  const colors = dark ? ["rgba(115, 190, 255, .26)", "rgba(76, 145, 235, .2)", "rgba(87, 216, 211, .13)"] : ["rgba(75, 151, 220, .3)", "rgba(70, 123, 208, .2)", "rgba(39, 191, 207, .14)"];
  for (let wave = 0; wave < 7; wave += 1) {
    const baseY = height * (0.28 + wave * 0.1);
    const amplitude = height * (0.045 + wave * 0.004);
    ctx.beginPath();
    for (let step = 0; step <= 32; step += 1) {
      const x = (step / 32) * width;
      const phase = time * (0.00015 + wave * 0.000025) + wave * 0.8;
      const y = baseY + Math.sin(step * 0.48 + phase) * amplitude + Math.sin(step * 0.17 - phase * 0.8) * amplitude * 0.45;
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = colors[wave % colors.length];
    ctx.lineWidth = Math.max(1, width / 900 + (wave % 2));
    ctx.stroke();
  }
  const glow = ctx.createRadialGradient(width * 0.78, height * 0.16, 0, width * 0.78, height * 0.16, width * 0.65);
  glow.addColorStop(0, dark ? "rgba(110, 152, 255, .2)" : "rgba(149, 194, 255, .25)");
  glow.addColorStop(1, "rgba(149, 194, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
};

export function ReactWaterSurfaceBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let frame = 0;
    let width = 1;
    let height = 1;
    let visible = true;
    let documentVisible = !document.hidden;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSurface(context, width, height, performance.now(), document.documentElement.classList.contains("dark"));
    };
    const render = (time: number) => {
      if (visible && documentVisible) drawSurface(context, width, height, reducedMotion ? 0 : time, document.documentElement.classList.contains("dark"));
      if (visible && documentVisible && !reducedMotion) frame = window.requestAnimationFrame(render);
    };
    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible && documentVisible && !reducedMotion && !frame) frame = window.requestAnimationFrame(render);
    });
    const themeObserver = new MutationObserver(() => resize());
    const onVisibility = () => {
      documentVisible = !document.hidden;
      if (documentVisible && visible && !reducedMotion && !frame) frame = window.requestAnimationFrame(render);
    };
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    if (!reducedMotion) frame = window.requestAnimationFrame(render);
    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />;
}
