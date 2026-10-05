/**
 * [INPUT]: 依赖 Canvas 2D、容器尺寸与浏览器可见性状态
 * [OUTPUT]: 对外提供云柜宝路线网络背景渲染器
 * [POS]: 云柜宝 Hero 的装饰层，模拟原 Vue 路线图的道路、地块与运输节点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from "react";

const drawRoadMap = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width * 0.5, height * 0.5);
  ctx.rotate(0.08);
  ctx.translate(-width * 0.5, -height * 0.5);

  ctx.fillStyle = "rgba(255, 255, 255, .3)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(234, 128, 62, .17)";
  ctx.lineWidth = 1;
  for (let index = -2; index < 13; index += 1) {
    const x = (index / 10) * width;
    ctx.beginPath();
    ctx.moveTo(x, -height * 0.1);
    ctx.lineTo(x + width * 0.26, height * 1.1);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(120, 178, 157, .12)";
  for (let index = 0; index < 18; index += 1) {
    const x = ((index * 83) % 1120) / 1120 * width;
    const y = ((index * 137) % 780) / 780 * height;
    const size = 24 + (index % 4) * 16;
    ctx.fillRect(x, y, size, size * 0.62);
  }

  ctx.beginPath();
  ctx.moveTo(-width * 0.1, height * 0.72);
  ctx.bezierCurveTo(width * 0.24, height * 0.57, width * 0.34, height * 0.9, width * 0.58, height * 0.68);
  ctx.bezierCurveTo(width * 0.78, height * 0.5, width * 0.92, height * 0.7, width * 1.1, height * 0.52);
  ctx.lineTo(width * 1.1, height * 0.68);
  ctx.bezierCurveTo(width * 0.9, height * 0.84, width * 0.78, height * 0.66, width * 0.58, height * 0.84);
  ctx.bezierCurveTo(width * 0.34, height * 1.04, width * 0.22, height * 0.72, -width * 0.1, height * 0.88);
  ctx.closePath();
  ctx.fillStyle = "rgba(85, 178, 207, .12)";
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 153, 84, .28)";
  ctx.lineWidth = Math.max(1.5, width / 700);
  const roadPaths = [
    [0.02, 0.21, 0.28, 0.28, 0.52, 0.2, 0.76, 0.32, 1.04, 0.2],
    [0.02, 0.5, 0.24, 0.42, 0.44, 0.52, 0.68, 0.42, 1.02, 0.5],
    [0.1, 0.92, 0.3, 0.72, 0.48, 0.78, 0.72, 0.62, 0.98, 0.72],
  ];
  roadPaths.forEach((points) => {
    ctx.beginPath();
    points.forEach((value, index) => {
      const x = value * width;
      const y = points[index + 1] * height;
      if (index % 2 === 0) index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  ctx.restore();

  const nodes = [
    [0.17, 0.21], [0.37, 0.27], [0.62, 0.2], [0.82, 0.33],
    [0.24, 0.48], [0.47, 0.5], [0.7, 0.43], [0.36, 0.76], [0.67, 0.65],
  ];
  nodes.forEach(([xRatio, yRatio], index) => {
    const pulse = 1 + Math.sin(time * 0.002 + index) * 0.2;
    ctx.beginPath();
    ctx.arc(width * xRatio, height * yRatio, 3.2 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = index % 3 === 0 ? "rgba(255, 126, 72, .7)" : "rgba(110, 97, 214, .5)";
    ctx.fill();
  });
  for (let index = 0; index < 7; index += 1) {
    const progress = ((time * 0.000035 + index / 7) % 1);
    const x = width * (0.08 + progress * 0.84);
    const y = height * (0.23 + Math.sin(progress * Math.PI * 2 + index) * 0.12 + (index % 2) * 0.16);
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 120, 60, .8)";
    ctx.fill();
  }
};

export function ReactYgbRoadMapBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let visible = true;
    let documentVisible = !document.hidden;
    let width = 1;
    let height = 1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRoadMap(context, width, height, performance.now());
    };
    const render = (time: number) => {
      if (visible && documentVisible) drawRoadMap(context, width, height, reducedMotion ? 0 : time);
      if (visible && documentVisible && !reducedMotion) frame = window.requestAnimationFrame(render);
    };
    const observer = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible && documentVisible && !reducedMotion && !frame) frame = window.requestAnimationFrame(render);
    });
    const onVisibility = () => {
      documentVisible = !document.hidden;
      if (documentVisible && visible && !reducedMotion && !frame) frame = window.requestAnimationFrame(render);
    };
    observer.observe(canvas);
    intersection.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    if (!reducedMotion) frame = window.requestAnimationFrame(render);
    return () => {
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />;
}
