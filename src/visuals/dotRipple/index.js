/**
 * [INPUT]: 依赖 ./trail 的跟随尾迹，依赖 ./shocks 的点击冲击环，依赖 ./params 的默认参数与 GLYPHS，依赖 Canvas 2D 与浏览器可见性/尺寸/指针事件；避让矩形由调用方给出 (相对 canvas 左上角的 CSS 像素，与 visuals/textExclusions 的产出同构)
 * [OUTPUT]: 对外提供 mountDotRipple(canvas, options)，返回 { dispose, setParams, setInk, setExclusions, setPaused, getFps }
 * [POS]: dotRipple 的唯一入口与渲染/生命周期层：把尾迹与冲击环合成的强度映射为 . : + # 字符并以精灵图绘制；与 twinkleDots 同为点阵背景引擎，但驱动源是指针；画面默认留白，字符只在鼠标扫过与点击处短暂浮现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createShocks } from "./shocks";
import { createTrail } from "./trail";
import { GLYPHS, defaultParams } from "./params";

const CELL_ASPECT = 1 / 0.7; // 字符格 高:宽。行距大于字高，字符才显得稀疏而轻
const MAX_CELLS = 26000; // 超出即放大字符，保证格数预算
const STEP_MS = 1000 / 60; // 尾迹衰减固定步长，与显示器刷新率解耦
const MAX_STEPS_PER_FRAME = 4;

/* 字符单色由页面按自己的底色决定 (ink)，引擎不感知主题；波峰波谷不分色，保持克制 */
const DEFAULT_INK = [255, 255, 255];
// 波幅 → 字符档位阈值：低于首档不绘制任何东西，画面默认是空的，只有涟漪经过处才浮现 . : + #
const LEVELS = [0.14, 0.34, 0.6, 0.88];
const GLYPH_FONT = 0.68; // 字号 / 行距
const TRAIL_AMP = 0.5; // 笔刷中心强度 (乘 pointer)
const SHOCK_AMP = 0.7; // 冲击环峰值强度 (乘 pointer)
const BRUSH_CLICK = 1.8; // 点击落点处的大笔刷倍率

const rgb = ([r, g, b]) => `rgb(${r},${g},${b})`;

export function mountDotRipple(canvas, { ink = DEFAULT_INK, paused = false, params = {} } = {}) {
  const ctx = canvas.getContext("2d");
  let current = { ...defaultParams(), ...params };
  let currentInk = ink, isPaused = paused;
  let trail = null, shocks = null, energy = null, sprites = [], layout = null;
  let lastCell = null;
  let exclusions = [], mask = null;
  let rafId = 0, lastNow = 0, accumulator = 0, fps = 60;
  let inViewport = true, docVisible = !document.hidden;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- 布局：按字符大小切格，格数超限则放大字符；重建后尾迹与冲击环清零 --- */
  const buildLayout = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let cellH = current.cell;
    const grid = () => ({ cw: cellH / CELL_ASPECT, cols: Math.ceil(rect.width / (cellH / CELL_ASPECT)), rows: Math.ceil(rect.height / cellH) });
    let g = grid();
    if (g.cols * g.rows > MAX_CELLS) { cellH *= Math.sqrt((g.cols * g.rows) / MAX_CELLS); g = grid(); }
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    layout = { dpr, cw: g.cw, ch: cellH, cols: Math.max(3, g.cols), rows: Math.max(3, g.rows), left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    trail = createTrail(layout.cols, layout.rows, CELL_ASPECT);
    shocks = createShocks(layout.cols, layout.rows, CELL_ASPECT);
    energy = new Float32Array(layout.cols * layout.rows);
    lastCell = null;
    buildSprites();
    buildMask();
  };

  /* --- 避让：落在文字矩形内的格子不绘制；尾迹与冲击环照常穿过，只是在文字下方不显影 --- */
  const buildMask = () => {
    mask = null;
    if (!exclusions.length || !layout) return;
    mask = new Uint8Array(layout.cols * layout.rows);
    for (const { x, y, width, height } of exclusions) {
      const x0 = Math.max(0, Math.floor(x / layout.cw)), x1 = Math.min(layout.cols - 1, Math.floor((x + width) / layout.cw));
      const y0 = Math.max(0, Math.floor(y / layout.ch)), y1 = Math.min(layout.rows - 1, Math.floor((y + height) / layout.ch));
      for (let row = y0; row <= y1; row++) mask.fill(1, row * layout.cols + x0, row * layout.cols + x1 + 1);
    }
  };

  /* --- 精灵图：4 张 (每档字符一张)，逐格 drawImage 比 fillText 便宜一个量级 --- */
  const buildSprites = () => {
    const w = Math.max(1, Math.ceil(layout.cw * layout.dpr)), h = Math.max(1, Math.ceil(layout.ch * layout.dpr));
    sprites = GLYPHS.map((glyph) => {
      const sprite = document.createElement("canvas");
      sprite.width = w; sprite.height = h;
      const g = sprite.getContext("2d");
      g.font = `600 ${Math.round(layout.ch * layout.dpr * GLYPH_FONT)}px ui-monospace, Menlo, Consolas, monospace`;
      g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = rgb(currentInk);
      g.fillText(glyph, w / 2, h / 2);
      return sprite;
    });
  };

  /* 强度合成：尾迹与冲击环取 max，叠在一起也不会爆成一片 # */
  const compose = () => {
    energy.set(trail.read());
    shocks.blend(energy, current.burst * Math.max(40, layout.cols * 0.4));
  };

  const draw = () => {
    if (!trail) return;
    compose();
    const { cols, rows } = layout;
    const cw = layout.cw * layout.dpr, ch = layout.ch * layout.dpr, gain = current.gain;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const v = Math.min(1, energy[i] * gain);
        if (v < LEVELS[0] || (mask && mask[i])) continue;
        const level = v < LEVELS[1] ? 0 : v < LEVELS[2] ? 1 : v < LEVELS[3] ? 2 : 3;
        ctx.globalAlpha = 0.25 + 0.55 * v;
        ctx.drawImage(sprites[level], Math.round(x * cw), Math.round(y * ch));
      }
    }
    ctx.globalAlpha = 1;
  };

  /* --- 驱动：尾迹按固定步长扩散衰减，冲击环按真实时间推进；一切只来自指针 --- */
  const frame = (now) => {
    const dt = lastNow ? Math.min(now - lastNow, 100) : 0;
    lastNow = now;
    if (dt > 0) fps += (1000 / dt - fps) * 0.08;
    accumulator += dt;
    for (let n = 0; accumulator >= STEP_MS && n < MAX_STEPS_PER_FRAME; n++, accumulator -= STEP_MS) trail.step(current.trailFade);
    if (accumulator > STEP_MS * MAX_STEPS_PER_FRAME) accumulator = 0;
    shocks.update(dt / 1000);
    draw();
    rafId = requestAnimationFrame(frame);
  };

  /* 减少动画偏好：画一道弧形尾迹加一圈刚扩开的冲击环，定格为静态画面 */
  const seedStatic = () => {
    const { cols, rows } = layout;
    for (let n = 0; n < 24; n++) {
      const k = n / 23;
      trail.stamp(cols * (0.18 + 0.4 * k), rows * (0.7 - 0.35 * Math.sin(k * Math.PI)), TRAIL_AMP * 0.8, current.brush);
    }
    shocks.add(cols * 0.72, rows * 0.45, SHOCK_AMP, 7);
    shocks.update(0.7);
  };

  const syncLoop = () => {
    const shouldRun = !isPaused && inViewport && docVisible && !reduceMotion;
    if (shouldRun && !rafId) { lastNow = 0; accumulator = 0; rafId = requestAnimationFrame(frame); }
    if (!shouldRun && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (!shouldRun) draw();
  };
  const relayout = () => { buildLayout(); if (reduceMotion) seedStatic(); if (!rafId) draw(); };

  /* --- 指针：移动沿途盖笔刷成尾迹，按下放出冲击环 --- */
  const toCell = (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return null;
    return [(e.clientX - rect.left) / layout.cw, (e.clientY - rect.top) / layout.ch];
  };
  const onMove = (e) => {
    const cell = toCell(e);
    if (!cell || !current.pointer) { lastCell = null; return; }
    const amp = TRAIL_AMP * current.pointer;
    if (lastCell) trail.line(lastCell[0], lastCell[1], cell[0], cell[1], amp, current.brush);
    else trail.stamp(cell[0], cell[1], amp, current.brush);
    lastCell = cell;
  };
  const onDown = (e) => {
    const cell = toCell(e);
    if (!cell || !current.pointer) return;
    trail.stamp(cell[0], cell[1], TRAIL_AMP * current.pointer * 1.4, current.brush * BRUSH_CLICK);
    shocks.add(cell[0], cell[1], SHOCK_AMP * current.pointer);
  };

  const resizeObserver = new ResizeObserver(relayout);
  resizeObserver.observe(canvas);
  const intersectionObserver = new IntersectionObserver((entries) => { inViewport = entries.some((e) => e.isIntersecting); syncLoop(); }, { threshold: 0.01 });
  intersectionObserver.observe(canvas);
  const onVisibility = () => { docVisible = !document.hidden; syncLoop(); };
  document.addEventListener("visibilitychange", onVisibility);
  if (!reduceMotion) {
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
  }

  relayout();
  syncLoop();

  return {
    setParams(next) {
      const cellChanged = next.cell !== undefined && next.cell !== current.cell;
      current = { ...current, ...next };
      if (cellChanged) relayout(); else if (!rafId) draw();
    },
    setInk(next) { currentInk = next; buildSprites(); if (!rafId) draw(); },
    setExclusions(next) { exclusions = next || []; buildMask(); if (!rafId) draw(); },
    setPaused(next) { isPaused = next; syncLoop(); },
    getFps: () => fps,
    dispose() {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    },
  };
}
