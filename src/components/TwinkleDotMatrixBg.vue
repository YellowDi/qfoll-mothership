<template>
  <canvas ref="canvasRef" class="twinkle-grid" aria-hidden="true"></canvas>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  cellSize: {
    type: Number,
    default: 14,
  },
  dotSize: {
    type: Number,
    default: 2,
  },
  baseOpacity: {
    type: Number,
    default: 0.22,
  },
  baseColor: {
    type: String,
    default: "#d9d9d9",
  },
  twinkleColor: {
    type: String,
    default: "#ff7a5c",
  },
  twinkleIntensity: {
    type: Number,
    default: 0.9,
  },
  twinkleRate: {
    type: Number,
    default: 0.0022,
  },
  minDuration: {
    type: Number,
    default: 600,
  },
  maxDuration: {
    type: Number,
    default: 1600,
  },
  cooldownMin: {
    type: Number,
    default: 800,
  },
  cooldownMax: {
    type: Number,
    default: 3000,
  },
  maxActiveTwinkles: {
    type: Number,
    default: 42,
  },
  enablePointerTrail: {
    type: Boolean,
    default: true,
  },
  trailLife: {
    type: Number,
    default: 520,
  },
  trailIntensity: {
    type: Number,
    default: 0.54,
  },
  excludeRects: {
    type: Array,
    default: () => [],
  },
});

const canvasRef = ref(null);

let ctx = null;
let width = 0;
let height = 0;
let dpr = 1;
let baseCanvas = null;
let points = [];
let cooldownUntil = new Float64Array(0);
const activeTwinkles = new Map();
let rafId = 0;
let running = false;
let lastSpawnTs = 0;
let reduceMotionMq = null;
let reduceMotion = false;
let inView = true;
let docVisible = true;
let resizeObserver = null;
let intersectionObserver = null;
let visibilityHandler = null;
let motionHandler = null;
let pointerFineMq = null;
let pointerFineHandler = null;
let pointerMoveHandler = null;
let twinkleRgb = [255, 122, 92];
let gridStep = 1;
let gridCols = 0;
const pointLookup = new Map();
const pointerTrailCells = new Map();
let lastPointerCol = null;
let lastPointerRow = null;
let lastExcludeRectsSig = "";
let lastPointerSampleTs = 0;
let cachedCanvasRect = null;
let cachedCanvasRectTs = 0;

const POINTER_SAMPLE_GAP_MS = 16;
const POINTER_RECT_CACHE_MS = 120;

const randomBetween = (min, max) => min + Math.random() * (max - min);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseColor = (hex) => {
  const normalized = String(hex || "").trim();
  if (!normalized.startsWith("#")) return [255, 122, 92];
  if (normalized.length === 4) {
    const r = Number.parseInt(normalized[1] + normalized[1], 16);
    const g = Number.parseInt(normalized[2] + normalized[2], 16);
    const b = Number.parseInt(normalized[3] + normalized[3], 16);
    if ([r, g, b].some((item) => Number.isNaN(item))) return [255, 122, 92];
    return [r, g, b];
  }
  if (normalized.length === 7) {
    const r = Number.parseInt(normalized.slice(1, 3), 16);
    const g = Number.parseInt(normalized.slice(3, 5), 16);
    const b = Number.parseInt(normalized.slice(5, 7), 16);
    if ([r, g, b].some((item) => Number.isNaN(item))) return [255, 122, 92];
    return [r, g, b];
  }
  return [255, 122, 92];
};

const smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

const pointKey = (col, row) => row * (gridCols + 1) + col;

const excludeRectsSignature = (rects) => {
  if (!rects.length) return "0";
  return rects
    .map((rect) =>
      [
        Number(rect.x).toFixed(3),
        Number(rect.y).toFixed(3),
        Number(rect.width).toFixed(3),
        Number(rect.height).toFixed(3),
      ].join(",")
    )
    .join("|");
};

const readCanvasRect = (now) => {
  const canvas = canvasRef.value;
  if (!canvas) return null;
  if (!cachedCanvasRect || now - cachedCanvasRectTs > POINTER_RECT_CACHE_MS) {
    cachedCanvasRect = canvas.getBoundingClientRect();
    cachedCanvasRectTs = now;
  }
  return cachedCanvasRect;
};

const toNormalizedExcludeRects = () => {
  if (!Array.isArray(props.excludeRects) || !props.excludeRects.length) return [];
  const normalized = [];
  for (const rect of props.excludeRects) {
    const x = Number(rect?.x);
    const y = Number(rect?.y);
    const w = Number(rect?.width);
    const h = Number(rect?.height);
    if (![x, y, w, h].every(Number.isFinite)) continue;
    if (w <= 0 || h <= 0) continue;
    normalized.push({ x, y, width: w, height: h });
  }
  return normalized;
};

const shouldRun = () => !reduceMotion && docVisible && inView;

const stopLoop = () => {
  running = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
};

const drawBaseLayer = () => {
  if (!baseCanvas || !width || !height) return;
  const baseCtx = baseCanvas.getContext("2d", { alpha: true });
  if (!baseCtx) return;
  baseCtx.imageSmoothingEnabled = false;
  baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  baseCtx.clearRect(0, 0, width, height);
  const [r, g, b] = parseColor(props.baseColor);
  baseCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${clamp(props.baseOpacity, 0, 1)})`;
  const dot = Math.max(1, Math.round(clamp(props.dotSize, 1, 6)));

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    baseCtx.fillRect(point.x, point.y, dot, dot);
  }
};

const markTrailCell = (col, row, at) => {
  const index = pointLookup.get(pointKey(col, row));
  if (index === undefined) return;
  const prevAt = pointerTrailCells.get(index) || 0;
  if (at > prevAt) {
    pointerTrailCells.set(index, at);
  }
};

const markTrailSegment = (fromCol, fromRow, toCol, toRow, at) => {
  let x0 = fromCol;
  let y0 = fromRow;
  const x1 = toCol;
  const y1 = toRow;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    markTrailCell(x0, y0, at);
    if (x0 === x1 && y0 === y1) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
};

const rebuildGrid = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  width = Math.max(1, Math.floor(rect.width));
  height = Math.max(1, Math.floor(rect.height));
  dpr = clamp(window.devicePixelRatio || 1, 1, 2);

  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));

  ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  baseCanvas = document.createElement("canvas");
  baseCanvas.width = canvas.width;
  baseCanvas.height = canvas.height;

  const step = clamp(props.cellSize, 5, 28);
  gridStep = Math.max(1, step);
  const cols = Math.ceil(width / step);
  gridCols = cols;
  const rows = Math.ceil(height / step);
  const xOffset = 0;
  const yOffset = 0;
  const dot = Math.max(1, Math.round(clamp(props.dotSize, 1, 6)));
  const excludeRects = toNormalizedExcludeRects();
  lastExcludeRectsSig = excludeRectsSignature(excludeRects);
  pointLookup.clear();
  pointerTrailCells.clear();
  lastPointerCol = null;
  lastPointerRow = null;
  cachedCanvasRect = null;
  cachedCanvasRectTs = 0;

  points = [];
  for (let row = 0; row <= rows; row += 1) {
    for (let col = 0; col <= cols; col += 1) {
      const x = Math.round(xOffset + col * step);
      const y = Math.round(yOffset + row * step);
      const px = x + dot * 0.5;
      const py = y + dot * 0.5;
      const shouldExclude = excludeRects.some((rect) => {
        return (
          px >= rect.x &&
          px <= rect.x + rect.width &&
          py >= rect.y &&
          py <= rect.y + rect.height
        );
      });
      if (shouldExclude) continue;
      const idx = points.length;
      points.push({ x, y });
      pointLookup.set(pointKey(col, row), idx);
    }
  }

  cooldownUntil = new Float64Array(points.length);
  const now = performance.now();
  for (let i = 0; i < cooldownUntil.length; i += 1) {
    cooldownUntil[i] = now + randomBetween(0, props.cooldownMax);
  }

  activeTwinkles.clear();
  drawBaseLayer();
  if (ctx && baseCanvas) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(baseCanvas, 0, 0, width, height);
  }
};

const spawnTwinkles = (now, elapsedMs) => {
  if (!points.length || elapsedMs <= 0) return;
  const maxActive = Math.max(
    14,
    Math.min(props.maxActiveTwinkles, Math.round((width * height) / 30000))
  );
  if (activeTwinkles.size >= maxActive) return;

  const elapsedSeconds = elapsedMs / 1000;
  const chance = clamp(props.twinkleRate, 0.0001, 0.03) * elapsedSeconds;

  for (let i = 0; i < points.length; i += 1) {
    if (activeTwinkles.size >= maxActive) break;
    if (activeTwinkles.has(i)) continue;
    if (now < cooldownUntil[i]) continue;
    if (Math.random() > chance) continue;

    const duration = randomBetween(props.minDuration, props.maxDuration);
    const holdRatio = randomBetween(0.06, 0.16);
    const peakAlpha = randomBetween(0.62, 1) * clamp(props.twinkleIntensity, 0.2, 1.6);
    activeTwinkles.set(i, {
      start: now,
      duration,
      holdRatio,
      peakAlpha,
    });

    cooldownUntil[i] =
      now + duration + randomBetween(props.cooldownMin, props.cooldownMax);
  }
};

const drawFrame = (now) => {
  if (!ctx || !baseCanvas) return;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(baseCanvas, 0, 0, width, height);
  const [r, g, b] = twinkleRgb;
  const dot = Math.max(1, Math.round(clamp(props.dotSize, 1, 6)));

  activeTwinkles.forEach((twinkle, index) => {
    const progress = (now - twinkle.start) / twinkle.duration;
    if (progress >= 1) {
      activeTwinkles.delete(index);
      return;
    }

    const fadeInEnd = (1 - twinkle.holdRatio) * 0.5;
    const holdEnd = fadeInEnd + twinkle.holdRatio;
    let envelope = 0;

    if (progress <= fadeInEnd) {
      envelope = smoothstep(progress / fadeInEnd);
    } else if (progress <= holdEnd) {
      envelope = 1;
    } else {
      const out = (progress - holdEnd) / (1 - holdEnd);
      envelope = 1 - smoothstep(out);
    }

    const alpha = envelope * twinkle.peakAlpha;
    if (alpha <= 0.002) return;

    const point = points[index];
    const drawSize = dot;
    const x = point.x;
    const y = point.y;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.2})`;
    ctx.fillRect(x - 1, y - 1, drawSize + 2, drawSize + 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fillRect(x, y, drawSize, drawSize);
  });

  if (!props.enablePointerTrail || !pointerFineMq?.matches || !pointerTrailCells.size) return;

  const life = Math.max(120, props.trailLife);
  const intensity = clamp(props.trailIntensity, 0.05, 1.6);

  for (const [index, at] of pointerTrailCells) {
    const age = now - at;
    if (age > life) {
      pointerTrailCells.delete(index);
      continue;
    }
    const ageFactor = 1 - age / life;
    const alpha = clamp(ageFactor * intensity, 0, 1);
    if (alpha < 0.012) continue;
    const point = points[index];
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.85})`;
    ctx.fillRect(point.x, point.y, dot, dot);
  }
};

const tick = (ts) => {
  if (!running) return;
  if (!lastSpawnTs) {
    lastSpawnTs = ts;
  }
  if (ts - lastSpawnTs >= 100) {
    spawnTwinkles(ts, ts - lastSpawnTs);
    lastSpawnTs = ts;
  }
  drawFrame(ts);
  rafId = requestAnimationFrame(tick);
};

const startLoop = () => {
  if (running || !shouldRun()) return;
  running = true;
  lastSpawnTs = 0;
  lastPointerSampleTs = 0;
  rafId = requestAnimationFrame(tick);
};

const syncLoopState = () => {
  if (shouldRun()) {
    startLoop();
    return;
  }
  stopLoop();
};

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas || typeof window === "undefined") return;

  twinkleRgb = parseColor(props.twinkleColor);
  docVisible = !document.hidden;
  reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduceMotion = reduceMotionMq.matches;
  motionHandler = (event) => {
    reduceMotion = event.matches;
    if (reduceMotion) {
      stopLoop();
      drawFrame(performance.now());
    } else {
      syncLoopState();
    }
  };
  reduceMotionMq.addEventListener("change", motionHandler);

  pointerFineMq = window.matchMedia("(pointer: fine)");
  pointerFineHandler = (event) => {
    if (!event.matches) {
      pointerTrailCells.clear();
      lastPointerCol = null;
      lastPointerRow = null;
    }
  };
  pointerFineMq.addEventListener("change", pointerFineHandler);

  pointerMoveHandler = (event) => {
    if (!props.enablePointerTrail) return;
    if (!pointerFineMq?.matches) return;
    if (!shouldRun()) return;
    if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    const now = performance.now();
    if (now - lastPointerSampleTs < POINTER_SAMPLE_GAP_MS) return;
    lastPointerSampleTs = now;
    const rect = readCanvasRect(now);
    if (!rect) return;
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      lastPointerCol = null;
      lastPointerRow = null;
      return;
    }
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    const col = Math.round(relX / gridStep);
    const row = Math.round(relY / gridStep);
    const at = now;

    if (lastPointerCol === null || lastPointerRow === null) {
      markTrailCell(col, row, at);
    } else {
      markTrailSegment(lastPointerCol, lastPointerRow, col, row, at);
    }
    lastPointerCol = col;
    lastPointerRow = row;
  };
  window.addEventListener("pointermove", pointerMoveHandler, { passive: true });

  rebuildGrid();

  resizeObserver = new ResizeObserver(() => {
    rebuildGrid();
  });
  resizeObserver.observe(canvas);

  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      syncLoopState();
    },
    { threshold: 0.05, rootMargin: "80px 0px 80px 0px" }
  );
  intersectionObserver.observe(canvas);

  visibilityHandler = () => {
    docVisible = !document.hidden;
    syncLoopState();
  };
  document.addEventListener("visibilitychange", visibilityHandler);

  if (reduceMotion) {
    drawFrame(performance.now());
    return;
  }
  startLoop();
});

watch(
  () => props.excludeRects,
  () => {
    if (!canvasRef.value) return;
    const normalized = toNormalizedExcludeRects();
    const sig = excludeRectsSignature(normalized);
    if (sig === lastExcludeRectsSig) return;
    rebuildGrid();
  },
  { deep: true }
);

watch(
  () => [props.cellSize, props.dotSize, props.baseOpacity, props.baseColor],
  () => {
    if (!canvasRef.value) return;
    rebuildGrid();
  }
);

watch(
  () => props.twinkleColor,
  (value) => {
    twinkleRgb = parseColor(value);
  }
);

onBeforeUnmount(() => {
  stopLoop();
  resizeObserver?.disconnect();
  resizeObserver = null;
  intersectionObserver?.disconnect();
  intersectionObserver = null;
  if (reduceMotionMq && motionHandler) {
    reduceMotionMq.removeEventListener("change", motionHandler);
  }
  if (pointerFineMq && pointerFineHandler) {
    pointerFineMq.removeEventListener("change", pointerFineHandler);
  }
  if (pointerMoveHandler) {
    window.removeEventListener("pointermove", pointerMoveHandler);
  }
  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
  }
  motionHandler = null;
  pointerFineHandler = null;
  pointerMoveHandler = null;
  visibilityHandler = null;
});
</script>

<style scoped>
.twinkle-grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
