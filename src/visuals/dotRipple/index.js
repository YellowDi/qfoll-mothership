/**
 * [INPUT]: 依赖 ./field 的 createWaveField 波场，依赖 ./params 的默认参数与 GLYPHS，依赖 Canvas 2D 与浏览器可见性/尺寸/指针事件；避让矩形由调用方给出 (相对 canvas 左上角的 CSS 像素，与 visuals/textExclusions 的产出同构)
 * [OUTPUT]: 对外提供 mountDotRipple(canvas, options)，返回 { dispose, setParams, setInk, setExclusions, setPaused, getFps }
 * [POS]: dotRipple 的唯一入口与渲染/生命周期层：把波场高度映射为 . : + # 字符并以精灵图绘制；与 twinkleDots 同为点阵背景引擎，但驱动源是波场；画面默认留白，字符只在涟漪经过处短暂浮现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createWaveField } from "./field";
import { GLYPHS, defaultParams } from "./params";

const CELL_ASPECT = 1 / 0.7; // 字符格 高:宽。行距大于字高，字符才显得稀疏而轻
const MAX_CELLS = 26000; // 超出即放大字符，保证格数预算
const STEP_MS = 1000 / 60; // 波场固定步长，与显示器刷新率解耦
const MAX_STEPS_PER_FRAME = 4;
const POINTER_GAP_MS = 24;
const STATIC_STEPS = 28; // 减少动画偏好下定格前预演的步数

/* 字符单色由页面按自己的底色决定 (ink)，引擎不感知主题；波峰波谷不分色，保持克制 */
const DEFAULT_INK = [255, 255, 255];
// 波幅 → 字符档位阈值：低于首档不绘制任何东西，画面默认是空的，只有涟漪经过处才浮现 . : + #
const LEVELS = [0.14, 0.34, 0.6, 0.88];
const GLYPH_FONT = 0.68; // 字号 / 行距

const rgb = ([r, g, b]) => `rgb(${r},${g},${b})`;

export function mountDotRipple(canvas, { ink = DEFAULT_INK, paused = false, params = {} } = {}) {
  const ctx = canvas.getContext("2d");
  let current = { ...defaultParams(), ...params };
  let currentInk = ink, isPaused = paused;
  let field = null, sprites = [], layout = null;
  let exclusions = [], mask = null;
  let rafId = 0, lastNow = 0, accumulator = 0, fps = 60;
  let inViewport = true, docVisible = !document.hidden;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- 布局：按字符大小切格，格数超限则放大字符；重建后波场清零 --- */
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
    field = createWaveField(layout.cols, layout.rows, CELL_ASPECT);
    buildSprites();
    buildMask();
  };

  /* --- 避让：落在文字矩形内的格子不绘制；波仍照常穿过，只是在文字下方不显影 --- */
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

  const draw = () => {
    if (!field) return;
    const { cols, rows } = field, h = field.read();
    const cw = layout.cw * layout.dpr, ch = layout.ch * layout.dpr, gain = current.gain;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const v = Math.min(1, Math.abs(h[i]) * gain);
        if (v < LEVELS[0] || (mask && mask[i])) continue;
        const level = v < LEVELS[1] ? 0 : v < LEVELS[2] ? 1 : v < LEVELS[3] ? 2 : 3;
        ctx.globalAlpha = 0.25 + 0.55 * v;
        ctx.drawImage(sprites[level], Math.round(x * cw), Math.round(y * ch));
      }
    }
    ctx.globalAlpha = 1;
  };

  /* --- 驱动：固定步长推进波场，波只来自指针 --- */
  const frame = (now) => {
    const dt = lastNow ? Math.min(now - lastNow, 100) : 0;
    lastNow = now;
    if (dt > 0) fps += (1000 / dt - fps) * 0.08;
    accumulator += dt;
    for (let n = 0; accumulator >= STEP_MS && n < MAX_STEPS_PER_FRAME; n++, accumulator -= STEP_MS) field.step(current.speed, current.damping);
    if (accumulator > STEP_MS * MAX_STEPS_PER_FRAME) accumulator = 0;
    draw();
    rafId = requestAnimationFrame(frame);
  };

  /* 减少动画偏好：放几滴水，预演到涟漪铺开后定格为一帧静态画面 */
  const seedStatic = () => {
    [[0.3, 0.4], [0.68, 0.55], [0.5, 0.78]].forEach(([fx, fy]) => field.drop(fx * field.cols, fy * field.rows, 1, 1.6));
    for (let i = 0; i < STATIC_STEPS; i++) field.step(current.speed, current.damping);
  };

  const syncLoop = () => {
    const shouldRun = !isPaused && inViewport && docVisible && !reduceMotion;
    if (shouldRun && !rafId) { lastNow = 0; accumulator = 0; rafId = requestAnimationFrame(frame); }
    if (!shouldRun && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (!shouldRun) draw();
  };
  const relayout = () => { buildLayout(); if (reduceMotion) seedStatic(); if (!rafId) draw(); };

  /* --- 指针：移动产生细涟漪，按下产生大涟漪 --- */
  let lastPointerAt = 0;
  const toCell = (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return null;
    return [(e.clientX - rect.left) / layout.cw, (e.clientY - rect.top) / layout.ch];
  };
  const onMove = (e) => {
    const now = performance.now();
    if (now - lastPointerAt < POINTER_GAP_MS || !current.pointer) return;
    const cell = toCell(e);
    if (!cell) return;
    lastPointerAt = now;
    field.drop(cell[0], cell[1], 0.2 * current.pointer, 1);
  };
  const onDown = (e) => {
    const cell = toCell(e);
    if (cell && current.pointer) field.drop(cell[0], cell[1], 0.9 * current.pointer, 1.5);
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
